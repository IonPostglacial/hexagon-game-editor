define(["lib/hexagon", "lib/pathfinding", "js/tile"], (hexagon, PF, Tile) => {
"use strict";

const allColors = Tile.types.map(prop => prop.color);
const tilesByColor = new Map();

let firstStep = {x: 0, y: 0};
let lastStep = {x: 0, y: 0};
let lastData = null;
let path = [];

return {
  setLastStep (grid, newLastStep) {
    lastStep = newLastStep;
    path = PF.shortestPathBetween(firstStep, lastStep, PF.hexDistance, (pos) => {
      if (!hexagon.grid.contains(grid, pos.x, pos.y)) {
        return false;
      }
      if (Tile.types[grid.data.get(pos)] === undefined) {
        console.log(grid);
        console.log(pos);
      }
      return grid.data.get(pos) === null || !Tile.types[grid.data.get(pos)].obstacle;
    });
  },

  drawBackground (bgCtx, grid) {
    if (grid.data && lastData !== grid.data) {
      lastData = grid.data;
      for (let color of allColors) {
        tilesByColor.set(color, []);
      }
      for (let entry of grid.data) {
        let pos = entry[0], tile = entry[1];
        if (tile !== null) {
          const obstacleCoord = hexagon.grid.axisToPixel(grid, pos.x, pos.y);
          tilesByColor.get(Tile.types[tile].color).push(obstacleCoord);
        }
      }
      for (let colorPosition of tilesByColor) {
        bgCtx.beginPath();
        bgCtx.fillStyle = colorPosition[0];
        for (let pos of colorPosition[1]) {
          hexagon.path(bgCtx, pos, grid.radius);
        }
        bgCtx.fill();
      }
      hexagon.grid.draw(bgCtx, grid, "rgb(150, 150, 150)");
    }
  },

  drawScene (ctx, grid, selectedTilePosition) {
    if (lastStep.x !== selectedTilePosition.x || lastStep.y !== selectedTilePosition.y) {
      this.setLastStep(grid, selectedTilePosition);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = "rgb(0, 255, 0)";
      for (let step of path) {
        const stepCoord = hexagon.grid.axisToPixel(grid, step.x, step.y);
        hexagon.path(ctx, stepCoord, grid.radius);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.strokeStyle = "rgb(255, 0, 0)";
      hexagon.path(ctx, hexagon.grid.axisToPixel(grid, firstStep.x, firstStep.y), grid.radius);
      hexagon.path(ctx, hexagon.grid.axisToPixel(grid, lastStep.x, lastStep.y), grid.radius);
      ctx.stroke();
    }
  }
}});
