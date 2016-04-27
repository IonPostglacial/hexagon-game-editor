"use strict";

const Heap = require('./heap');
const deltas = [-1, 0, -1, 1, 0, -1, 0, 1, 1, -1, 1, 0];

class Point {
  constructor (x, y) {
    this.x = x;
    this.y = y;
  }
  equals (other) {
    return this.x === other.x && this.y === other.y;
  }
  hash() {
    return String.fromCharCode(this.x, this.y);
  }
}

class PointMap extends Map {
  get (point) {
    return super.get(point.hash());
  }
  has(point) {
    return super.has(point.hash());
  }
  set (point, value) {
    super.set(point.hash(), value);
  }
}

function getNeighbors(p, isWalkable) {
  var neighbors = [];
  for (var i = 0; i < deltas.length; i += 2) {
    var x = p.x + deltas[i], y = p.y + deltas[i + 1];
    const neighbor = new Point(x, y);
    if (isWalkable(neighbor)) {
      neighbors.push(neighbor);
    }
  }
  return neighbors;
}

function reconstructPath(nodes, start, goal) {
  let path = [];
  let currentPosition = goal;
  while (!currentPosition.equals(start)) {
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

module.exports = {
  shortestPathBetween(startPos, goalPos, distance, isWalkable) {
    const start = new Point(startPos.x, startPos.y);
    const goal = new Point(goalPos.x, goalPos.y);

    let nodes = new PointMap();
    let currentPosition = start;

    nodes.set(start, {cameFrom: start, f: 0, g: 0, h: 0});
    const frontier = new Heap((pos1, pos2) => {
      if (pos1.equals(pos2)) {
        return 0;
      }
      let n1 = nodes.get(pos1);
      let n2 = nodes.get(pos2);
      return n1.h > n2.h ? 1 : -1;
    });
    frontier.push(start);
    while (!frontier.empty()) {
      currentPosition = frontier.pop();
      if (currentPosition.equals(goal)) break;
      let neighbors = getNeighbors(currentPosition, isWalkable);
      for (let neighbor of neighbors) {
        let f = nodes.get(currentPosition).f + distance(currentPosition, neighbor);
        let g = distance(neighbor, goal);
        if (!nodes.has(neighbor) || f < nodes.get(neighbor).f) {
          nodes.set(neighbor, {cameFrom: currentPosition, f: f, g: g, h: f + g});
          frontier.push(neighbor);
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
