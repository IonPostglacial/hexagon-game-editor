function initMapEditor(grid, scene, coordMouse, coordHex) {
  "use strict";

  const BACKGROUND = document.createElement('canvas');
  scene.width = BACKGROUND.width = hexagon.grid.pixelWidth(grid);
  scene.height = BACKGROUND.height = hexagon.grid.pixelHeight(grid);
  const CTX = scene.getContext("2d");
  const BG_CTX = BACKGROUND.getContext('2d');
  let firstStep = {x: 0, y: 0};
  let lastStep = {x: 0, y: 0};
  let path = [];

  BG_CTX.fillStyle = "rgb(0, 0, 0)";
  BG_CTX.fillRect(0, 0, scene.width, scene.height);
  hexagon.grid.draw(BG_CTX, grid, "rgb(0, 0, 255)");

  function drawScene() {
    CTX.drawImage(BACKGROUND, 0, 0);
    for (let obstacle of grid.obstacles) {
      const obstacleCoord = hexagon.grid.axisToPixel(grid, obstacle.x, obstacle.y);
      hexagon.draw(CTX, obstacleCoord, grid.radius, "rgb(255, 255, 0)");
    }
    for (let step of path) {
      const stepCoord = hexagon.grid.axisToPixel(grid, step.x, step.y);
      hexagon.draw(CTX, stepCoord, grid.radius, "rgb(0, 255, 0)");
    }
    hexagon.draw(CTX, hexagon.grid.axisToPixel(grid, firstStep.x, firstStep.y), grid.radius, "rgb(255, 0, 0)");
    hexagon.draw(CTX, hexagon.grid.axisToPixel(grid, lastStep.x, lastStep.y), grid.radius, "rgb(255, 0, 0)");
  }

  drawScene();

  scene.onmousemove = (e) => {
    const currentCoordinates = hexagon.grid.pixelToAxis(grid, e.offsetX, e.offsetY);
    if (lastStep.x !== currentCoordinates.x || lastStep. y !== currentCoordinates.y) {
      lastStep = currentCoordinates;
      path = PF.shortestPathBetween(firstStep, lastStep, PF.hexDistance, (pos) => {
        const maxDimension = Math.max(grid.width, grid.height * 2 - 1);
        if (pos.x < -maxDimension || pos.x > maxDimension || pos.y < 0 || pos.y > grid.height * 2 - 1) {
          return false;
        }
        for (let obstacle of grid.obstacles) {
          if (pos.x === obstacle.x && pos.y === obstacle.y) {
            return false;
          }
        }
        return true
      });
      drawScene();
    }
    coordMouse.rows[0].cells[1].innerHTML = e.offsetX;
    coordMouse.rows[0].cells[3].innerHTML = e.offsetY;
    coordHex.rows[0].cells[1].innerHTML = lastStep.x;
    coordHex.rows[0].cells[3].innerHTML = lastStep.y;
  };

  scene.onclick = (e) => {
    const obstacle = hexagon.grid.pixelToAxis(grid, e.offsetX, e.offsetY);
    grid.obstacles.push(obstacle);
  };
}
