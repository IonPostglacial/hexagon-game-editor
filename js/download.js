define({ init(grid, uploaded, uploadScene, downloadScene) {
  "use strict";

  uploadScene.onclick = (e) => {
    uploaded.click();
  };

  uploaded.onchange = (e) => {
    const READER = new FileReader();
    READER.onload = (e) => {
      grid.obstacles = JSON.parse(READER.result);
    };
    READER.readAsText(uploaded.files[0]);
  };

  downloadScene.onclick = (e) => {
    var blob = new Blob([JSON.stringify(grid.obstacles)], {type : 'application/json'});
    downloadScene.href = URL.createObjectURL(blob);
  };
}});
