(() => {
"use strict";

window.addEventListener('load', (e) => {
const $ = document.querySelector.bind(document);
  $('#uploaded').onchange = (e) => {
    const READER = new FileReader();
    READER.onload = (e) => {
      window.obstacles = JSON.parse(READER.result);
    };
    READER.readAsText($('#uploaded').files[0]);
  };

  $('#download-scene').onclick = (e) => {
    var blob = new Blob([JSON.stringify(window.obstacles)], {type : 'application/json'});
    $('#download-scene').href = URL.createObjectURL(blob);
  };
});
return {};
})();
