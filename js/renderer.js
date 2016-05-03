"use strict";

const hexagon = require('../lib/hexagon');
const Tile    = require('./tile');

function tilesRendering (ctx, selectedPosition) {
  const allColors = Tile.types.map(prop => prop.color);
  const tilesByColor = new Map();
  let lastData = undefined;
  return ({tiles, radius, width, height}) => {
    if (!tiles || lastData === tiles) { return; }
    lastData = tiles;
    for (let color of allColors) {
      tilesByColor.set(color, []);
    }
    for (let [pos, tile] of tiles) {
      const obstacleCoord = hexagon.grid.axisToPixel(pos.x, pos.y, radius);
      tilesByColor.get(Tile.types[tile].color).push(obstacleCoord);
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (let [color, position] of tilesByColor) {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.fillStyle = color;
      for (let pos of position) {
        hexagon.path(ctx, pos, radius);
      }
      ctx.fill();
    }
    hexagon.grid.draw(ctx, {radius, width, height}, "rgb(150, 150, 150)");
  };
}

function overlayRendering (ctx, selectedPosition, selectedTileType) {
  return (radius, currentCursorPosition, currentTileTypeSelection) => {
    if (selectedPosition === currentCursorPosition && selectedTileType === currentTileTypeSelection) { return; }
    selectedPosition = currentCursorPosition;
    selectedTileType = currentTileTypeSelection;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.fillStyle = Tile.types[selectedTileType].color;
    hexagon.path(ctx, hexagon.grid.axisToPixel(selectedPosition.x, selectedPosition.y, radius), radius);
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(0, 255, 0)";
    hexagon.path(ctx, hexagon.grid.axisToPixel(selectedPosition.x, selectedPosition.y, radius), radius);
    ctx.stroke();
  };
}

module.exports = {tilesRendering, overlayRendering};
