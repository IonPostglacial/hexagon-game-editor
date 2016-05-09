"use strict";

const React    = require('react');
const hexagon  = require('../lib/hexagon');
const {tilesRendering, overlayRendering} = require('./renderer');

const R = React.DOM;

module.exports = React.createClass({displayName: 'MultiLayerCanvas',
  componentDidMount () {
    const renderTiles = tilesRendering(this._layers.children[0].getContext('2d'), this.props.selectedTile);
    const renderOverlay = overlayRendering(this._layers.children[2].getContext("2d"), this.props.selectedTile, this.props.selectedTileType);
    this.drawScene = () => {
      renderTiles(this.props.grid);
      renderOverlay(this.props.grid.radius, this.props.selectedTile, this.props.selectedTileType);
    };
    this.drawScene();
  },
  drawScene () {},
  render () {
    this.drawScene();
    const pixWidth = Math.ceil(hexagon.grid.pixelWidth(this.props.grid.width, this.props.grid.radius));
    const pixHeight = Math.ceil(hexagon.grid.pixelHeight(this.props.grid.height, this.props.grid.radius));
    return (
      R.div({onClick: this.props.onClick, onMouseMove: this.props.onMouseMove, ref: layers => this._layers = layers, style: {width: pixWidth, height: pixHeight}, className: 'layers'},
        R.canvas({className: 'layer checkboard', width: pixWidth, height: pixHeight}, "This page is useless without canvas"),
        R.canvas({className: 'layer', width: pixWidth, height: pixHeight}, "This page is useless without canvas"),
        R.canvas({className: 'layer', width: pixWidth, height: pixHeight}, "This page is useless without canvas")
      )
    );
  }
});
