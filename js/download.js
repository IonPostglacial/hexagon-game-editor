define(["lib/hexmap"], function (HexMap) {
"use strict";
const R = React.DOM;

function gridToJson (grid) {
  const valueGrid = Object.assign({}, grid);
  valueGrid.tiles = grid.tiles.data;
  return JSON.stringify(valueGrid);
}

function gridFromJson (json) {
  const grid = JSON.parse(json);
  grid.tiles = new HexMap(grid.width, grid.height, 0, grid.tiles);
  return grid;
}

const PushButton = React.createClass({displayName: 'PushButton',
  render () {
    const linkAttributes = {className: 'btn', href: this.props.href, onClick: this.props.onClick};
    if (this.props.download) {
      linkAttributes.download = this.props.download;
    }
    return (
      R.a(linkAttributes,
        R.i({className: 'fa fa-pull-left fa-lg ' + this.props.icon}),
        this.props.text
      )
    );
  }
});

return React.createClass({displayName: 'Download',
  getInitialState () {
    return { downloadLink: null };
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
      R.ul({className: 'centered tool-box'},
        R.li({className: 'tool'},
          React.createElement(PushButton, {icon: 'fa-download', text: "Download current stage",
            href: this.state.downloadLink, download: "scene.json", onClick: this.handleDownload})
        ),
        R.li({className: 'tool'},
          React.createElement(PushButton, {icon: 'fa-upload', text: "Upload a stage", onClick: this.handleUpload})
        ),
        R.li({className: 'tool'},
          React.createElement(PushButton, {icon: 'fa-floppy-o', text: "Save current stage", onClick: this.handleSave})
        ),
        R.li({className: 'tool'},
          React.createElement(PushButton, {icon: 'fa-folder-open-o', text: "Load stage", onClick: this.handleLoad})
        )
      )
    );
  }
});
});
