define(["lib/hexagon"], (hexagon) => {
  // A specialized Map type for storing hexagonal maps
  "use strict";

  class HexMap {
    constructor(width, height, data) {
      this.width = width;
      this.height = height;
      this._xOffset = Math.ceil(0.5 * this.height) - 1;
      if (data === undefined) {
        this.data = new Array(this.height * (this.width + this._xOffset));
        for (let pos of hexagon.grid.allCoords(this)) {
          this.set(pos, null);
        }
      } else {
        this.data = data;
      }
    }

    get (pos) {
      return this.data[this._xOffset + pos.x + pos.y * this.width];
    }

    set (pos, value) {
      this.data[this._xOffset + pos.x + pos.y * this.width] = value;
    }

    has (pos) {
      return hexagon.grid.contains(this, pos.x, pos.y);
    }

    clear () {
      this.data.clear();
    }

    delete (pos) {
      this.set(pos, null);
    }

    *entries () {
      for (let pos of hexagon.grid.allCoords(this)) {
        yield [pos, this.get(pos)];
      }
    }

    forEach(fun) {
      for (let key of this.keys()) {
        fun(this.get(key), key, this);
      }
    }

    keys () {
      let keys = new Array(this.data.length);
      let i = 0;
      for (let pos of hexagon.grid.allCoords(this)) {
        keys[i] = pos;
        i++;
      }
    }

    values () {
      return this.data.filter(e => e !== undefined);
    }

    *[Symbol.iterator]() {
      for (let pos of hexagon.grid.allCoords(this)) {
        yield [pos, this.get(pos)];
      }
    }
  }

  return HexMap;
})
