define(["lib/hexagon", "lib/pathfinding", "js/tile"], (hexagon, PF, Tile) => {
"use strict";

class Renderer {
  constructor (firstStep, lastStep) {
    this.allColors = Tile.types.map(prop => prop.color);
    this.tilesByColor = new Map();
    this.firstStep = firstStep;
    this.lastStep = lastStep;
    this.lastData = null;
    this.path = [];
  }

  setLastStep (grid, newLastStep) {
    this.lastStep = newLastStep;
    this.path = PF.shortestPathBetween(this.firstStep, this.lastStep, PF.hexDistance, (pos) => {
      if (!hexagon.grid.contains(grid, pos.x, pos.y)) {
        return false;
      }
      return grid.data.get(pos) === null || !Tile.types[grid.data.get(pos)].obstacle;
    });
  }

  drawBackground (bgCtx, grid) {
    if (!grid.data || this.lastData === grid.data) { return; }
    this.lastData = grid.data;
    for (let color of this.allColors) {
      this.tilesByColor.set(color, []);
    }
    for (let [pos, tile] of grid.data) {
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

  drawScene (ctx, grid, selectedTilePosition) {
    if (this.lastStep === selectedTilePosition) { return; }
    this.setLastStep(grid, selectedTilePosition);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = "rgb(0, 255, 0)";
    for (let step of this.path) {
      const stepCoord = hexagon.grid.axisToPixel(grid, step.x, step.y);
      hexagon.path(ctx, stepCoord, grid.radius);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "rgb(255, 0, 0)";
    hexagon.path(ctx, hexagon.grid.axisToPixel(grid, this.firstStep.x, this.firstStep.y), grid.radius);
    hexagon.path(ctx, hexagon.grid.axisToPixel(grid, this.lastStep.x, this.lastStep.y), grid.radius);
    ctx.stroke();
  }
}

return Renderer;

});
