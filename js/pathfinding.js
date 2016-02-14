PF = (() => {
  "use strict";
  const deltas = [
    -1, 0,
    -1, 1,
    0, -1,
    0, 1,
    1, -1,
    1, 0
  ];

  function hashP(point) {
    return String.fromCharCode(point.x, point.y);
  }

  function getNeighbors(p, isWalkable) {
    let neighbors = [];
    for (let i = 0; i < deltas.length; i += 2) {
      let x = p.x + deltas[i], y = p.y + deltas[i + 1];
      if (isWalkable({x, y})) {
        neighbors.push({x, y});
      }
    }
    return neighbors;
  }

  function reconstructPath(nodes, start, goal) {
    let path = [];
    let currentPosition = goal;
    while (currentPosition.x !== start.x || currentPosition.y !== start.y) {
      path.push(currentPosition);
      let currentNode = nodes.get(hashP(currentPosition));
      if (currentNode === undefined) {
        return [];
      }
      currentPosition = currentNode.cameFrom;
    }
    path.push(start);
    return path;
  }

  return {
    shortestPathBetween(start, goal, distance, isWalkable) {
      let nodes = new Map();
      let currentPosition = start;
      const comparePositions = (pos1, pos2) => {
        if (pos1.x === pos2.x && pos1.y === pos2.y) {
            return 0;
        }
        let n1 = nodes.get(hashP(pos1));
        let n2 = nodes.get(hashP(pos2));
        return n1.h > n2.h ? 1 : -1;
      };
      const frontier = new PriorityQueue({comparator: comparePositions});

      nodes.set(hashP(start), {cameFrom: start, f: 0, g: 0, h: 0});
      frontier.queue(start);
      while (frontier.length !== 0) {
        currentPosition = frontier.dequeue();
        if (currentPosition.x === goal.x && currentPosition.y === goal.y) break;
        let neighbors = getNeighbors(currentPosition, isWalkable);
        for (var i in neighbors) {
          let f = nodes.get(hashP(currentPosition)).f + distance(currentPosition, neighbors[i]);
          let g = distance(neighbors[i], goal);
          if (!nodes.has(hashP(neighbors[i])) || f < nodes.get(hashP(neighbors[i])).f) {
            nodes.set(hashP(neighbors[i]), {cameFrom: currentPosition, f: f, g: g, h: f + g});
            frontier.queue(neighbors[i]);
          }
        }
      }
      return reconstructPath(nodes, start, goal);
    },
    hexDistance(p1, p2) {
      return (Math.abs(p1.x - p2.x) +
        Math.abs(p1.x + p1.y - p2.x - p2.y) +
        Math.abs(p1.y - p2.y)) / 2
    }
  };
})();
