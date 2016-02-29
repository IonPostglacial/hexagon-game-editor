PF = (() => {
  "use strict";
  const deltas = [-1, 0, -1, 1, 0, -1, 0, 1, 1, -1, 1, 0];

  class Point {
    constructor (x, y) {
      this.x = x;
      this.y = y;
    }
    equals (other) {
      return this.x === other.x && this.y === other.y;
    }
    hash () {
      return String.fromCharCode(this.x, this.y);
    }
  }

  function getNeighbors(p, isWalkable) {
    var neighbors = [];
    for (var i = 0; i < deltas.length; i += 2) {
      var x = p.x + deltas[i], y = p.y + deltas[i + 1];
      if (isWalkable({x, y})) {
        neighbors.push(new Point(x, y));
      }
    }
    return neighbors;
  }

  function reconstructPath(nodes, start, goal) {
    let path = [];
    let currentPosition = goal;
    while (!currentPosition.equals(start)) {
      path.push(currentPosition);
      let currentNode = nodes.get(currentPosition.hash());
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
      const start = new Point(startPos.x, startPos.y);
      const goal = new Point(goalPos.x, goalPos.y);
      let nodes = new Map();
      let currentPosition = start;
      const comparePositions = (pos1, pos2) => {
        if (pos1.equals(pos2)) {
            return 0;
        }
        let n1 = nodes.get(pos1.hash());
        let n2 = nodes.get(pos2.hash());
        return n1.h > n2.h ? 1 : -1;
      };
      const frontier = new PriorityQueue({comparator: comparePositions});

      nodes.set(start.hash(), {cameFrom: start, f: 0, g: 0, h: 0});
      frontier.queue(start);
      while (frontier.length !== 0) {
        currentPosition = frontier.dequeue();
        if (currentPosition.equals(goal)) break;
        let neighbors = getNeighbors(currentPosition, isWalkable);
        for (let neighbor of neighbors) {
          let f = nodes.get(currentPosition.hash()).f + distance(currentPosition, neighbor);
          let g = distance(neighbor, goal);
          if (!nodes.has(neighbor.hash()) || f < nodes.get(neighbor.hash()).f) {
            nodes.set(neighbor.hash(), {cameFrom: currentPosition, f: f, g: g, h: f + g});
            frontier.queue(neighbor);
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
