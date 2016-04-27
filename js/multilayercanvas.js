"use strict";

const React    = require('react');
const hexagon  = require('../lib/hexagon');
const Renderer = require('./renderer');

const R = React.DOM;

module.exports = React.createClass({displayName: 'MultiLayerCanvas',
  componentDidMount () {
    this.bgCtx = this._layers.children[0].getContext('2d');
    this.fgCtx = this._layers.children[2].getContext("2d");
    this.renderer = new Renderer(this.props.selectedTile, this.props.selectedTileType);
    this.drawScene = function () {
      this.renderer.drawBackground(this.bgCtx, this.props);
      this.renderer.drawForeground(this.fgCtx, this.props, this.props.selectedTile, this.props.selectedTileType);
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
        R.canvas({className: 'layer', width: pixWidth, height: pixHeight}, "This page is useless without canvas"),
        R.canvas({className: 'layer', width: pixWidth, height: pixHeight}, "This page is useless without canvas"),
        R.canvas({className: 'layer', width: pixWidth, height: pixHeight}, "This page is useless without canvas")
      )
    );
  }
});
