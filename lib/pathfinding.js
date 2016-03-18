define(["lib/heap", "lib/immutable"], (Heap, Immutable) => {
  "use strict";
  const deltas = [-1, 0, -1, 1, 0, -1, 0, 1, 1, -1, 1, 0];
  const Point = Immutable.Record({x: 0, y: 0});

  function getNeighbors(p, isWalkable) {
    var neighbors = [];
    for (var i = 0; i < deltas.length; i += 2) {
      var x = p.x + deltas[i], y = p.y + deltas[i + 1];
      if (isWalkable({x, y})) {
        neighbors.push(new Point({x, y}));
      }
    }
    return neighbors;
  }

  function reconstructPath(nodes, start, goal) {
    let path = [];
    let currentPosition = goal;
    while (!Immutable.is(currentPosition, start)) {
      path.push(currentPosition);
      let currentNode = nodes.get(currentPosition);
      if (currentNode === undefined) {
        return [];
      }
      currentPosition = currentNode.cameFrom;
    }
    path.push(start);
    return path;
  }

  return {
    shortestPathBetween(startPos, goalPos, distance, isWalkable) {
      const start = new Point(startPos);
      const goal = new Point(goalPos);
      let nodes = Immutable.Map.of(start, {cameFrom: start, f: 0, g: 0, h: 0});
      let currentPosition = start;
      nodes = nodes.withMutations(mutNodes => {
        const frontier = new Heap((pos1, pos2) => {
          if (Immutable.is(pos1, pos2)) {
              return 0;
          }
          let n1 = mutNodes.get(pos1);
          let n2 = mutNodes.get(pos2);
          return n1.h > n2.h ? 1 : -1;
        });
        frontier.push(start);
        while (!frontier.empty()) {
          currentPosition = frontier.pop();
          if (Immutable.is(currentPosition, goal)) break;
          let neighbors = getNeighbors(currentPosition, isWalkable);
          for (let neighbor of neighbors) {
            let f = mutNodes.get(currentPosition).f + distance(currentPosition, neighbor);
            let g = distance(neighbor, goal);
            if (!mutNodes.has(neighbor) || f < mutNodes.get(neighbor).f) {
              mutNodes.set(neighbor, {cameFrom: currentPosition, f: f, g: g, h: f + g});
              frontier.push(neighbor);
            }
          }
        }
      });
      return reconstructPath(nodes, start, goal);
    },
    hexDistance(p1, p2) {
      return (Math.abs(p1.x - p2.x) +
        Math.abs(p1.x + p1.y - p2.x - p2.y) +
        Math.abs(p1.y - p2.y)) / 2
    }
  };
});
