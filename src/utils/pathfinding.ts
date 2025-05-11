import { Heap } from './heap';

const deltas = [-1, 0, -1, 1, 0, -1, 0, 1, 1, -1, 1, 0];

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static equals(point: Point, other: Point): boolean {
    return point.x === other.x && point.y === other.y;
  }

  static hash(point: Point): string {
    return String.fromCharCode(point.x, point.y);
  }
}

class PointMap<T> {
  private nativeMap: Map<string, T>;

  constructor() {
    this.nativeMap = new Map();
  }

  get(point: Point): T | undefined {
    return this.nativeMap.get(Point.hash(point));
  }

  has(point: Point): boolean {
    return this.nativeMap.has(Point.hash(point));
  }

  set(point: Point, value: T): void {
    this.nativeMap.set(Point.hash(point), value);
  }
}

function getNeighbors(p: Point, isWalkable: (point: Point) => boolean): Point[] {
  const neighbors: Point[] = [];
  for (let i = 0; i < deltas.length; i += 2) {
    const x = p.x + deltas[i];
    const y = p.y + deltas[i + 1];
    const neighbor = new Point(x, y);
    if (isWalkable(neighbor)) {
      neighbors.push(neighbor);
    }
  }
  return neighbors;
}

function reconstructPath(
  nodes: PointMap<{ cameFrom: Point; f: number; g: number; h: number }>,
  start: Point,
  goal: Point
): Point[] {
  const path: Point[] = [];
  let currentPosition = goal;
  while (!Point.equals(currentPosition, start)) {
    path.push(currentPosition);
    const currentNode = nodes.get(currentPosition);
    if (currentNode === undefined) {
      return [];
    }
    currentPosition = currentNode.cameFrom;
  }
  path.push(start);
  return path.reverse();
}

export function shortestPathBetween(
  startPos: { x: number; y: number },
  goalPos: { x: number; y: number },
  distance: (p1: Point, p2: Point) => number,
  isWalkable: (point: Point) => boolean
): Point[] {
  const start = new Point(startPos.x, startPos.y);
  const goal = new Point(goalPos.x, goalPos.y);

  const nodes = new PointMap<{ cameFrom: Point; f: number; g: number; h: number }>();
  let currentPosition: Point | undefined = start;

  nodes.set(start, { cameFrom: start, f: 0, g: 0, h: 0 });
  const frontier = new Heap((pos1: Point, pos2: Point) => {
    if (Point.equals(pos1, pos2)) {
      return 0;
    }
    const n1 = nodes.get(pos1)!;
    const n2 = nodes.get(pos2)!;
    return n1.h > n2.h ? 1 : -1;
  });
  frontier.push(start);

  while (!frontier.empty()) {
    currentPosition = frontier.pop();
    if (!currentPosition || Point.equals(currentPosition, goal)) {
      break;
    }
    const neighbors = getNeighbors(currentPosition, isWalkable);
    for (const neighbor of neighbors) {
      const f = nodes.get(currentPosition)!.f + distance(currentPosition, neighbor);
      const g = distance(neighbor, goal);
      if (!nodes.has(neighbor) || f < nodes.get(neighbor)!.f) {
        nodes.set(neighbor, { cameFrom: currentPosition, f, g, h: f + g });
        frontier.push(neighbor);
      }
    }
  }

  return reconstructPath(nodes, start, goal);
}

export function hexDistance(p1: Point, p2: Point): number {
  return (
    (Math.abs(p1.x - p2.x) +
      Math.abs(p1.x + p1.y - p2.x - p2.y) +
      Math.abs(p1.y - p2.y)) /
    2
  );
}