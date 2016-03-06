define(["lib/hexmap"], (HexMap) => {
  "use strict";

  return {
    init(grid, uploaded, uploadScene, downloadScene) {
      function gridToJson (grid) {
        const valueGrid = Object.assign({}, grid);
        valueGrid.data = valueGrid.data.data;
        return JSON.stringify(valueGrid);
      }

      function gridFromJson (json) {
        const grid = JSON.parse(json);
        grid.data = new HexMap(grid.width, grid.height, grid.data);
        return grid;
      }

      uploadScene.onclick = (e) => {
        uploaded.click();
      };

      uploaded.onchange = (e) => {
        const READER = new FileReader();
        READER.onload = (e) => {
          Object.assign(grid, gridFromJson(READER.result));
        };
        READER.readAsText(uploaded.files[0]);
      };

      downloadScene.onclick = (e) => {
        var blob = new Blob([gridToJson(grid)], {type : 'application/json'});
        downloadScene.href = URL.createObjectURL(blob);
      };
    }
  }
});
