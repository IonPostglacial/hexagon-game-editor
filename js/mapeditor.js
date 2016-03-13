define(["lib/hexagon"], (hexagon, PF) => {
"use strict";

const $ = document.querySelector.bind(document);
const coordMouse = $('#coord-mouse');
const coordHex = $('#coord-hex');
let selectedTileType = parseInt($('#tile-type-selector input[type="radio"]:checked').value);
let lastSelectedCoords = {x: 0, y: 0};

return {
  ontiletypechange (e) {},
  onselectedtilechange (e) {},
  init(grid) {
    $('#layers').onmousemove = (e) => {
      const currentCoords = hexagon.grid.pixelToAxis(grid, e.offsetX, e.offsetY);
      if (lastSelectedCoords.x !== currentCoords.x || lastSelectedCoords. y !== currentCoords.y) {
        this.onselectedtilechange ({coordinates: currentCoords});
        lastSelectedCoords = currentCoords;
      }
      coordMouse.rows[0].cells[1].innerHTML = e.offsetX;
      coordMouse.rows[0].cells[3].innerHTML = e.offsetY;
      coordHex.rows[0].cells[1].innerHTML = lastSelectedCoords.x;
      coordHex.rows[0].cells[3].innerHTML = lastSelectedCoords.y;
    };

    $('#layers').onclick = (e) => {
      const obstacle = hexagon.grid.pixelToAxis(grid, e.offsetX, e.offsetY);
      if (hexagon.grid.contains(grid, obstacle.x, obstacle.y)) {
        this.ontiletypechange ({position: obstacle, tileType: selectedTileType});
      }
    };

    $('#tile-type-selector').onclick = (e) => {
      selectedTileType = parseInt($('#tile-type-selector input[type="radio"]:checked').value);
    };
  }
}});
