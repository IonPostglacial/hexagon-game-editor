define(require => { "use strict";

const hexagon   = require('lib/hexagon');
const PF        = require('lib/pathfinding');
const Tile      = require('js/tile');
const Immutable = require('lib/immutable');
const Point = Immutable.Record({x: 0, y: 0});

class Renderer {
  constructor (selectedPosition, selectedTileType) {
    this.allColors = Tile.types.map(prop => prop.color);
    this.tilesByColor = new Map();
    this.selectedPosition = selectedPosition;
    this.selectedTileType = selectedTileType;
    this.lastData = null;
    this.path = [];
  }

  drawBackground (bgCtx, grid) {
    if (!grid.tiles || this.lastData === grid.tiles) { return; }
    this.lastData = grid.tiles;
    for (let color of this.allColors) {
      this.tilesByColor.set(color, []);
    }
    for (let [pos, tile] of grid.tiles) {
      if (tile !== null) {
        const obstacleCoord = hexagon.grid.axisToPixel(grid, pos.x, pos.y);
        this.tilesByColor.get(Tile.types[tile].color).push(obstacleCoord);
      }
    }
    for (let [color, position] of this.tilesByColor) {
      bgCtx.beginPath();
      bgCtx.fillStyle = color;
      for (let pos of position) {
        hexagon.path(bgCtx, pos, grid.radius);
      }
      bgCtx.fill();
    }
    hexagon.grid.draw(bgCtx, grid, "rgb(150, 150, 150)");
  }

  drawScene (ctx, grid, selectedTilePosition, selectedTileType) {
    if (this.selectedPosition === selectedTilePosition && this.selectedTileType === selectedTileType) { return; }
    this.selectedPosition = selectedTilePosition;
    this.selectedTileType = selectedTileType;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = "rgb(0, 255, 0)";
    hexagon.path(ctx, hexagon.grid.axisToPixel(grid, selectedTilePosition.x, selectedTilePosition.y), grid.radius);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = Tile.types[selectedTileType].color;
    hexagon.path(ctx, hexagon.grid.axisToPixel(grid, selectedTilePosition.x, selectedTilePosition.y), grid.radius);
    ctx.fill();
  }
}

return Renderer;

});
