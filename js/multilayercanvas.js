define(["lib/hexagon", "js/renderer"], (hexagon, Renderer) => {
"use strict";
const R = React.DOM;

return React.createClass({displayName: 'MultiLayerCanvas',
  componentDidMount () {
    this.bgCtx = this._layers.children[0].getContext('2d');
    this.ctx = this._layers.children[1].getContext("2d");
    this.renderer = new Renderer();
    this.drawScene = function () {
      this.renderer.drawBackground(this.bgCtx, this.props);
      this.renderer.drawScene(this.ctx, this.props, this.props.selectedTile);
    };
    this.drawScene();
  },
  drawScene () {},
  render () {
    this.drawScene();
    const pixWidth = hexagon.grid.pixelWidth(this.props);
    const pixHeight = hexagon.grid.pixelHeight(this.props);
    return (
      R.div({onClick: this.props.onClick, onMouseMove: this.props.onMouseMove, ref: layers => this._layers = layers, style: {width: pixWidth, height: pixHeight}, className: 'layers'},
        R.canvas({className: 'layer', width: pixWidth, height: pixHeight}, "This page is useless without canvas"),
        R.canvas({className: 'layer', width: pixWidth, height: pixHeight}, "This page is useless without canvas")
      )
    );
  }
});

});
