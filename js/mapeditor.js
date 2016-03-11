define(["lib/hexagon", "lib/pathfinding"], (hexagon, PF) => {
  return { init(grid, layers, tileTypeSelector, coordMouse, coordHex) {
    "use strict";

    const SCENE_WIDTH = hexagon.grid.pixelWidth(grid);
    const SCENE_HEIGHT = hexagon.grid.pixelHeight(grid);
    const TileType = { LAND: 0, ROCK: 1, WATER: 2, VOID: 3, SAND: 4 };
    const TileProperties = [
      {obstacle: false, color: "rgb(100, 50, 0)"},
      {obstacle: true, color: "rgb(100, 100, 100)"},
      {obstacle: true, color: "rgb(0, 150, 200)"},
      {obstacle: true, color: "rgb(0, 0, 0)"},
      {obstacle: false, color: "rgb(255, 218, 65)"}
    ];
    let selectedTileType = TileType.LAND;

    layers.style.width = SCENE_WIDTH + "px";
    layers.style.height = SCENE_HEIGHT + "px";
    for (let i = 0; i < layers.children.length; i++) {
      layers.children[i].width = SCENE_WIDTH;
      layers.children[i].height = SCENE_HEIGHT;
    }
    const BG_CTX = layers.children[0].getContext('2d');
    const CTX = layers.children[1].getContext("2d");
    let firstStep = {x: 0, y: 0};
    let lastStep = {x: 0, y: 0};
    let path = [];

    BG_CTX.fillStyle = "rgb(50, 50, 50)";
    BG_CTX.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    hexagon.grid.draw(BG_CTX, grid, "rgb(150, 150, 150)");

    function drawScene() {
      CTX.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
      for (let entry of grid.data) {
        let pos = entry[0], tile = entry[1];
        if (tile !== null) {
          const obstacleCoord = hexagon.grid.axisToPixel(grid, pos.x, pos.y);
          hexagon.draw(CTX, obstacleCoord, grid.radius, TileProperties[tile].color);
        }
      }
      for (let step of path) {
        const stepCoord = hexagon.grid.axisToPixel(grid, step.x, step.y);
        hexagon.draw(CTX, stepCoord, grid.radius, "rgb(0, 255, 0)");
      }
      hexagon.draw(CTX, hexagon.grid.axisToPixel(grid, firstStep.x, firstStep.y), grid.radius, "rgb(255, 0, 0)");
      hexagon.draw(CTX, hexagon.grid.axisToPixel(grid, lastStep.x, lastStep.y), grid.radius, "rgb(255, 0, 0)");
    }

    drawScene();

    layers.onmousemove = (e) => {
      const currentCoordinates = hexagon.grid.pixelToAxis(grid, e.offsetX, e.offsetY);
      if (lastStep.x !== currentCoordinates.x || lastStep. y !== currentCoordinates.y) {
        lastStep = currentCoordinates;
        path = PF.shortestPathBetween(firstStep, lastStep, PF.hexDistance, (pos) => {
          if (!hexagon.grid.contains(grid, pos.x, pos.y)) {
            return false;
          }
          return grid.data.get(pos) === null || !TileProperties[grid.data.get(pos)].obstacle;
        });
        drawScene();
      }
      coordMouse.rows[0].cells[1].innerHTML = e.offsetX;
      coordMouse.rows[0].cells[3].innerHTML = e.offsetY;
      coordHex.rows[0].cells[1].innerHTML = lastStep.x;
      coordHex.rows[0].cells[3].innerHTML = lastStep.y;
    };

    tileTypeSelector.onclick = (e) => {
      selectedTileType = parseInt(tileTypeSelector.elements['tile-type'].value);
    };

    layers.onclick = (e) => {
      const obstacle = hexagon.grid.pixelToAxis(grid, e.offsetX, e.offsetY);
      if(hexagon.grid.contains(grid, obstacle.x, obstacle.y)) {
        grid.data.set(obstacle, selectedTileType);
      }
    };
  }}
});
