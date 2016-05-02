"use strict";

const React    = require('react');
const hexagon  = require('../lib/hexagon');
const createRenderer = require('./renderer');

const R = React.DOM;

module.exports = React.createClass({displayName: 'MultiLayerCanvas',
  componentDidMount () {
    const bgCtx = this._layers.children[0].getContext('2d');
    const fgCtx = this._layers.children[2].getContext("2d");
    const renderer = createRenderer(this.props.selectedTile, this.props.selectedTileType);
    this.drawScene = () => {
      renderer.drawBackground(bgCtx, this.props);
      renderer.drawForeground(fgCtx, this.props, this.props.selectedTile, this.props.selectedTileType);
    };
    this.drawScene();
  },
  drawScene () {},
  render () {
    this.drawScene();
    const pixWidth = Math.ceil(hexagon.grid.pixelWidth(this.props));
    const pixHeight = Math.ceil(hexagon.grid.pixelHeight(this.props));
    return (
      R.div({onClick: this.props.onClick, onMouseMove: this.props.onMouseMove, ref: layers => this._layers = layers, style: {width: pixWidth, height: pixHeight}, className: 'layers'},
        R.canvas({className: 'layer checkboard', width: pixWidth, height: pixHeight}, "This page is useless without canvas"),
        R.canvas({className: 'layer', width: pixWidth, height: pixHeight}, "This page is useless without canvas"),
        R.canvas({className: 'layer', width: pixWidth, height: pixHeight}, "This page is useless without canvas")
      )
    );
  }
});
