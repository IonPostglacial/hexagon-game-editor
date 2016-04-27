const React      = require('react');
const ReactDOM   = require('react-dom');
const { PushButton, Popover, MenuEntry } = require('../lib/htk/hextk');
const Immutable  = require('../lib/immutable');
const hexagon    = require('../lib/hexagon');

const R = React.DOM;
const Point = Immutable.Record({x: 0, y: 0});

function gridToJson (grid) {
  const valueGrid = Object.assign({}, grid);
  const data = [];
  for (let coord of hexagon.grid.allCoords(grid)) {
    data.push(grid.tiles.get(new Point(coord)));
  }
  valueGrid.tiles = data;
  return JSON.stringify(valueGrid);
}

function gridFromJson (json) {
  const grid = JSON.parse(json);
  const tiles = Immutable.Map().withMutations(map => {
    let i = 0;
    for (let coord of hexagon.grid.allCoords({width: grid.width, height: grid.height})) {
      map.set(new Point(coord), grid.tiles[i]);
      i++;
    }
  });
  grid.tiles = tiles;
  return grid;
}

module.exports = React.createClass({displayName: 'ActionBar',
  getInitialState () {
    return { downloadLink: undefined };
  },
  componentDidMount () {
    this.uploaded = Object.assign(document.createElement('input'), { type: 'file', style: 'display:none' });
    this.uploaded.onchange = (e) => {
      const READER = new FileReader();
      READER.onload = (e) => {
        this.props.onSceneChange({ scene: gridFromJson(READER.result) });
      };
      READER.readAsText(this.uploaded.files[0]);
    };
    document.getElementById('editor').appendChild(this.uploaded);
  },
  handleLoad (e) {
    const scene = localStorage.scene;
    if (scene) {
      this.props.onSceneChange({ scene: gridFromJson(scene) });
    }
  },
  handleSave (e) {
    localStorage.scene = gridToJson(this.props.grid);
  },
  handleUpload (e) {
    this.uploaded.click();
  },
  handleDownload (e) {
    const blob = new Blob([gridToJson(this.props.grid)], {type : 'application/json'});
    this.setState({ downloadLink: URL.createObjectURL(blob) });
  },
  render () {
    return (
      R.div({className: 'centered tool-box'},
        React.createElement(PushButton, {icon: 'fa-download', label: "Download current stage",
          href: this.state.downloadLink, download: "scene.json", onClick: this.handleDownload}),
        React.createElement(PushButton, {icon: 'fa-clone', label: "Snapshot", onClick: this.handleSave}),
        React.createElement(PushButton, {icon: 'fa-undo', label: "Restore", onClick: this.handleLoad}),
        React.createElement(Popover, {label: "Load"},
          React.createElement(MenuEntry, {icon: 'fa-globe', label: "Stage", onClick: this.handleUpload}),
          React.createElement(MenuEntry, {icon: 'fa-file-image-o', label: "Tileset"}),
          React.createElement(MenuEntry, {icon: 'fa-cubes', label: "Components"})
        )
      )
    );
  }
});
