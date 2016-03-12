define(["lib/hexmap"], (HexMap) => {
  "use strict";

  return {
    init(grid) {
      const $ = document.querySelector.bind(document);
      const uploaded = $('#uploaded');
      const uploadScene = $('#upload-scene');
      const downloadScene = $('#download-scene');
      const saveScene = $('#save-scene');
      const loadScene = $('#load-scene');

      function gridToJson (grid) {
        const valueGrid = Object.assign({}, grid);
        valueGrid.data = String.fromCharCode(...valueGrid.data.data);
        return JSON.stringify(valueGrid);
      }

      function gridFromJson (json) {
        const grid = JSON.parse(json);
        const data = new Array(grid.data.length);
        for (let i = 0; i < grid.data.length; i++) {
            data[i] = grid.data.charCodeAt(i);
        }
        grid.data = new HexMap(grid.width, grid.height, 0, data);
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
        downloadScene.download = "scene.json";
      };

      saveScene.onclick = (e) => {
        localStorage.scene = gridToJson(grid);
      };

      loadScene.onclick = (e) => {
        var scene = localStorage.scene;
        if (scene) {
          Object.assign(grid, gridFromJson(scene));
        }
      };
    }
  }
});
