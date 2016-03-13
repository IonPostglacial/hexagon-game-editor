define(["lib/hexagon", "lib/pathfinding", "js/tile"], (hexagon, PF, Tile) => {
"use strict";

const $ = document.querySelector.bind(document);
const layers = $('#layers');
const allColors = Tile.types.map(prop => prop.color);
const tilesByColor = new Map();
const BG_CTX = layers.children[0].getContext('2d');
const CTX = layers.children[1].getContext("2d");

let firstStep = {x: 0, y: 0};
let lastStep = {x: 0, y: 0};
let path = [];

return {
  init (grid) {
    this.grid = grid;
    this.scene_width = hexagon.grid.pixelWidth(this.grid);
    this.scene_height = hexagon.grid.pixelHeight(this.grid);
    layers.style.width = this.scene_width + "px";
    layers.style.height = this.scene_height + "px";
    for (let i = 0; i < layers.children.length; i++) {
      layers.children[i].width = this.scene_width;
      layers.children[i].height = this.scene_height;
    }
    BG_CTX.fillStyle = "rgb(50, 50, 50)";
    BG_CTX.fillRect(0, 0, this.scene_width, this.scene_height);
    this.drawBackground();
    this.drawScene();
  },

  setLastStep (newLastStep) {
    lastStep = newLastStep;
    path = PF.shortestPathBetween(firstStep, lastStep, PF.hexDistance, (pos) => {
      if (!hexagon.grid.contains(this.grid, pos.x, pos.y)) {
        return false;
      }
      return this.grid.data.get(pos) === null || !Tile.types[this.grid.data.get(pos)].obstacle;
    });
  },

  drawBackground () {
    for (let color of allColors) {
      tilesByColor.set(color, []);
    }
    for (let entry of this.grid.data) {
      let pos = entry[0], tile = entry[1];
      if (tile !== null) {
        const obstacleCoord = hexagon.grid.axisToPixel(this.grid, pos.x, pos.y);
        tilesByColor.get(Tile.types[tile].color).push(obstacleCoord);
      }
    }
    for (let colorPosition of tilesByColor) {
      BG_CTX.beginPath();
      BG_CTX.fillStyle = colorPosition[0];
      for (let pos of colorPosition[1]) {
        hexagon.path(BG_CTX, pos, this.grid.radius);
      }
      BG_CTX.fill();
    }
    hexagon.grid.draw(BG_CTX, this.grid, "rgb(150, 150, 150)");
  },

  drawScene() {
    CTX.clearRect(0, 0, this.scene_width, this.scene_height);
    CTX.beginPath();
    CTX.strokeStyle = "rgb(0, 255, 0)";
    for (let step of path) {
      const stepCoord = hexagon.grid.axisToPixel(this.grid, step.x, step.y);
      hexagon.path(CTX, stepCoord, this.grid.radius);
    }
    CTX.stroke();
    CTX.beginPath();
    CTX.strokeStyle = "rgb(255, 0, 0)";
    hexagon.path(CTX, hexagon.grid.axisToPixel(this.grid, firstStep.x, firstStep.y), this.grid.radius);
    hexagon.path(CTX, hexagon.grid.axisToPixel(this.grid, lastStep.x, lastStep.y), this.grid.radius);
    CTX.stroke();
  }
}});
