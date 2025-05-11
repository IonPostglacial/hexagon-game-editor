export type Comparator<T> = (a: T, b: T) => number;

const defaultCmp: Comparator<any> = (x, y) => {
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
};

function heappush<T>(array: T[], item: T, cmp: Comparator<T> = defaultCmp): void {
  array.push(item);
  _siftdown(array, 0, array.length - 1, cmp);
}

function heappop<T>(array: T[], cmp: Comparator<T> = defaultCmp): T | undefined {
  const lastelt = array.pop();
  if (array.length === 0) return lastelt;
  const returnitem = array[0];
  array[0] = lastelt!;
  _siftup(array, 0, cmp);
  return returnitem;
}

function heapreplace<T>(array: T[], item: T, cmp: Comparator<T> = defaultCmp): T {
  const returnitem = array[0];
  array[0] = item;
  _siftup(array, 0, cmp);
  return returnitem;
}

function heappushpop<T>(array: T[], item: T, cmp: Comparator<T> = defaultCmp): T {
  if (array.length && cmp(array[0], item) < 0) {
    [item, array[0]] = [array[0], item];
    _siftup(array, 0, cmp);
  }
  return item;
}

function heapify<T>(array: T[], cmp: Comparator<T> = defaultCmp): void {
  for (let i = Math.floor(array.length / 2) - 1; i >= 0; i--) {
    _siftup(array, i, cmp);
  }
}

function updateItem<T>(array: T[], item: T, cmp: Comparator<T> = defaultCmp): void {
  const pos = array.indexOf(item);
  if (pos === -1) return;
  _siftdown(array, 0, pos, cmp);
  _siftup(array, pos, cmp);
}

function _siftdown<T>(array: T[], startpos: number, pos: number, cmp: Comparator<T>): void {
  const newitem = array[pos];
  while (pos > startpos) {
    const parentpos = (pos - 1) >> 1;
    const parent = array[parentpos];
    if (cmp(newitem, parent) < 0) {
      array[pos] = parent;
      pos = parentpos;
    } else {
      break;
    }
  }
  array[pos] = newitem;
}

function _siftup<T>(array: T[], pos: number, cmp: Comparator<T>): void {
  const endpos = array.length;
  const startpos = pos;
  const newitem = array[pos];
  let childpos = 2 * pos + 1;
  while (childpos < endpos) {
    const rightpos = childpos + 1;
    if (rightpos < endpos && cmp(array[childpos], array[rightpos]) > 0) {
      childpos = rightpos;
    }
    array[pos] = array[childpos];
    pos = childpos;
    childpos = 2 * pos + 1;
  }
  array[pos] = newitem;
  _siftdown(array, startpos, pos, cmp);
}

export class Heap<T> {
  private nodes: T[];
  private cmp: Comparator<T>;

  constructor(cmp: Comparator<T> = defaultCmp) {
    this.nodes = [];
    this.cmp = cmp;
  }

  push(x: T): void {
    heappush(this.nodes, x, this.cmp);
  }

  pop(): T | undefined {
    return heappop(this.nodes, this.cmp);
  }

  peek(): T | undefined {
    return this.nodes[0];
  }

  contains(x: T): boolean {
    return this.nodes.includes(x);
  }

  replace(x: T): T {
    return heapreplace(this.nodes, x, this.cmp);
  }

  pushpop(x: T): T {
    return heappushpop(this.nodes, x, this.cmp);
  }

  heapify(): void {
    heapify(this.nodes, this.cmp);
  }

  updateItem(x: T): void {
    updateItem(this.nodes, x, this.cmp);
  }

  clear(): void {
    this.nodes = [];
  }

  empty(): boolean {
    return this.nodes.length === 0;
  }

  size(): number {
    return this.nodes.length;
  }

  clone(): Heap<T> {
    const heap = new Heap(this.cmp);
    heap.nodes = [...this.nodes];
    return heap;
  }

  toArray(): T[] {
    return [...this.nodes];
  }
}