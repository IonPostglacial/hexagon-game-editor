"use strict";

const hexagon = require('../lib/hexagon');
const Tile    = require('./tile');

function createRenderer (selectedPosition, selectedTileType) {
  const allColors = Tile.types.map(prop => prop.color);
  const tilesByColor = new Map();
  const path = [];
  let lastData = undefined;
  return {
    drawBackground (ctx, grid) {
      if (!grid.tiles || lastData === grid.tiles) { return; }
      lastData = grid.tiles;
      for (let color of allColors) {
        tilesByColor.set(color, []);
      }
      for (let [pos, tile] of grid.tiles) {
        const obstacleCoord = hexagon.grid.axisToPixel(grid, pos.x, pos.y);
        tilesByColor.get(Tile.types[tile].color).push(obstacleCoord);
      }
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for (let [color, position] of tilesByColor) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.fillStyle = color;
        for (let pos of position) {
          hexagon.path(ctx, pos, grid.radius);
        }
        ctx.fill();
      }
      hexagon.grid.draw(ctx, grid, "rgb(150, 150, 150)");
    },
    drawForeground (ctx, grid, selectedTilePosition, selectedTileType) {
      if (selectedPosition === selectedTilePosition && selectedTileType === selectedTileType) { return; }
      selectedPosition = selectedTilePosition;
      selectedTileType = selectedTileType;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.beginPath();
      ctx.fillStyle = Tile.types[selectedTileType].color;
      hexagon.path(ctx, hexagon.grid.axisToPixel(grid, selectedTilePosition.x, selectedTilePosition.y), grid.radius);
      ctx.fill();
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgb(0, 255, 0)";
      hexagon.path(ctx, hexagon.grid.axisToPixel(grid, selectedTilePosition.x, selectedTilePosition.y), grid.radius);
      ctx.stroke();
    }
  }
}

module.exports = createRenderer;
