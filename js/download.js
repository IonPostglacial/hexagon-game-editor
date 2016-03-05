define({ init(grid, uploaded, uploadScene, downloadScene) {
  "use strict";

  uploadScene.onclick = (e) => {
    uploaded.click();
  };

  uploaded.onchange = (e) => {
    const READER = new FileReader();
    READER.onload = (e) => {
      Object.assign(grid, JSON.parse(READER.result));
    };
    READER.readAsText(uploaded.files[0]);
  };

  downloadScene.onclick = (e) => {
    var blob = new Blob([JSON.stringify(grid)], {type : 'application/json'});
    downloadScene.href = URL.createObjectURL(blob);
  };
}});
