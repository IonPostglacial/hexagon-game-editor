(() => {
"use strict";

const SCENE_WIDTH = 800;
const SCENE_HEIGHT = 600;
const GRID = {width: 14, height:6, radius: 32};
window.obstacles = [{x: 5, y: 5}];

window.addEventListener('load', (e) => {
const $ = document.querySelector.bind(document);
  const CTX = Object.assign($('#scene'), {width: SCENE_WIDTH, height: SCENE_HEIGHT}).getContext("2d");
  let firstStep = {x: 0, y: 0};
  let lastStep = {x: 0, y: 0};
  let path = [];

  function drawScene() {
    CTX.fillStyle = "rgb(0, 0, 0)";
    CTX.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    hexagon.grid.draw(CTX, GRID, "rgb(0, 0, 255)");
    for (let obstacle of window.obstacles) {
      const obstacleCoord = hexagon.grid.axisToPixel(GRID, obstacle.x, obstacle.y);
      hexagon.draw(CTX, obstacleCoord, GRID.radius, "rgb(255, 255, 0)");
    }
    for (let step of path) {
      const stepCoord = hexagon.grid.axisToPixel(GRID, step.x, step.y);
      hexagon.draw(CTX, stepCoord, GRID.radius, "rgb(0, 255, 0)");
    }
    hexagon.draw(CTX, hexagon.grid.axisToPixel(GRID, firstStep.x, firstStep.y), GRID.radius, "rgb(255, 0, 0)");
    hexagon.draw(CTX, hexagon.grid.axisToPixel(GRID, lastStep.x, lastStep.y), GRID.radius, "rgb(255, 0, 0)");
  }

  drawScene();

  $('#scene').onmousemove = (e) => {
    const currentCoordinates = hexagon.grid.pixelToAxis(GRID, e.offsetX, e.offsetY);
    if (lastStep.x !== currentCoordinates.x || lastStep. y !== currentCoordinates.y) {
      lastStep = currentCoordinates;
      path = PF.shortestPathBetween(firstStep, lastStep, PF.hexDistance, (pos) => {
        const maxDimension = Math.max(GRID.width, GRID.height * 2 - 1);
        if (pos.x < -maxDimension || pos.x > maxDimension || pos.y < 0 || pos.y > GRID.height * 2 - 1) {
          return false;
        }
        for (let obstacle of window.obstacles) {
          if (pos.x === obstacle.x && pos.y === obstacle.y) {
            return false;
          }
        }
        return true
      });
    }
    drawScene();
    $('#coord-mouse').rows[0].cells[1].innerHTML = e.offsetX;
    $('#coord-mouse').rows[0].cells[3].innerHTML = e.offsetY;
    $('#coord-hex').rows[0].cells[1].innerHTML = lastStep.x;
    $('#coord-hex').rows[0].cells[3].innerHTML = lastStep.y;
  };

  $('#scene').onclick = (e) => {
    const obstacle = hexagon.grid.pixelToAxis(GRID, e.offsetX, e.offsetY);
    window.obstacles.push(obstacle);
  };
});
})();
