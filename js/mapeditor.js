define(["lib/hexagon", "lib/pathfinding"], (hexagon, PF) => {

const $ = document.querySelector.bind(document);
const layers = $('#layers')
const tileTypeSelector = $('#tile-type-selector');
const coordMouse = $('#coord-mouse');
const coordHex = $('#coord-hex');
const TileProperties = [
  {name: "Land", obstacle: false, color: "rgb(100, 50, 0)"},
  {name: "Rock", obstacle: true, color: "rgb(100, 100, 100)"},
  {name: "Water", obstacle: true, color: "rgb(0, 150, 200)"},
  {name: "Void", obstacle: true, color: "rgb(0, 0, 0)"},
  {name: "Sand", obstacle: false, color: "rgb(255, 218, 65)"}
];
const allColors = TileProperties.map(prop => prop.color);
const tilesByColor = new Map();
const BG_CTX = layers.children[0].getContext('2d');
const CTX = layers.children[1].getContext("2d");

let selectedTileType = parseInt(tileTypeSelector.elements['tile-type'].value);
let firstStep = {x: 0, y: 0};
let lastStep = {x: 0, y: 0};
let path = [];

return {
  init(grid) {
    "use strict";

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

    layers.onmousemove = (e) => {
      const currentCoordinates = hexagon.grid.pixelToAxis(this.grid, e.offsetX, e.offsetY);
      if (lastStep.x !== currentCoordinates.x || lastStep. y !== currentCoordinates.y) {
        lastStep = currentCoordinates;
        path = PF.shortestPathBetween(firstStep, lastStep, PF.hexDistance, (pos) => {
          if (!hexagon.grid.contains(this.grid, pos.x, pos.y)) {
            return false;
          }
          return this.grid.data.get(pos) === null || !TileProperties[this.grid.data.get(pos)].obstacle;
        });
        this.drawScene();
      }
      coordMouse.rows[0].cells[1].innerHTML = e.offsetX;
      coordMouse.rows[0].cells[3].innerHTML = e.offsetY;
      coordHex.rows[0].cells[1].innerHTML = lastStep.x;
      coordHex.rows[0].cells[3].innerHTML = lastStep.y;
    };

    layers.oncontextmenu = (e) => {
      e.preventDefault();
      const currentCoordinates = hexagon.grid.pixelToAxis(grid, e.offsetX, e.offsetY);
      firstStep = currentCoordinates;
      return false;
    };

    tileTypeSelector.onclick = (e) => {
      selectedTileType = parseInt($('#tile-type-selector input[type="radio"]:checked').value);
    };

    layers.onclick = (e) => {
      const obstacle = hexagon.grid.pixelToAxis(this.grid, e.offsetX, e.offsetY);
      if(hexagon.grid.contains(this.grid, obstacle.x, obstacle.y)) {
        this.grid.data.set(obstacle, selectedTileType);
        this.drawBackground();
      }
    };
  },

  drawBackground() {
    for (let color of allColors) {
      tilesByColor.set(color, []);
    }
    for (let entry of this.grid.data) {
      let pos = entry[0], tile = entry[1];
      if (tile !== null) {
        const obstacleCoord = hexagon.grid.axisToPixel(this.grid, pos.x, pos.y);
        tilesByColor.get(TileProperties[tile].color).push(obstacleCoord);
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
