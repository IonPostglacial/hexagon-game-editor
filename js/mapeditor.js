define(["lib/hexagon", "js/hselectbox", "js/coordbox", "js/multilayercanvas", "js/download", "js/tile", "lib/hexmap"],
  (hexagon, HSelectBox, CoordBox, MultiLayerCanvas, Download, Tile, HexMap) => {
"use strict";

const R = React.DOM;

return React.createClass({displayName: 'MapEditor',
  getInitialState () {
    return {
      cursorPixCoords: {x: 0, y: 0},
      cursorHexCoords: {x: 0, y: 0},
      selectedTileType: 0,
      width: this.props.width,
      height: this.props.height,
      radius: this.props.radius,
      data: new HexMap(this.props.width, this.props.height, 0)
    };
  },
  handleMouseMove (e) {
    const event = e.nativeEvent;
    const hexCoords = hexagon.grid.pixelToAxis(this.state, event.offsetX, event.offsetY);
    if (hexagon.grid.contains(this.state, hexCoords.x, hexCoords.y)) {
      this.setState({
        cursorPixCoords: {x: event.offsetX, y: event.offsetY},
        cursorHexCoords: {x: hexCoords.x, y: hexCoords.y}
      });
    }
  },
  handleClick (e) {
    const event = e.nativeEvent;
    const obstacle = hexagon.grid.pixelToAxis(this.state, event.offsetX, event.offsetY);
    if (hexagon.grid.contains(this.state, obstacle.x, obstacle.y)) {
      const newData = new HexMap(this.state.data.width, this.state.data.height, 0, this.state.data.data);
      newData.set(obstacle, this.state.selectedTileType);
      this.setState({data: newData});
    }
  },
  handleSceneChange (e) {
    const { width, height, radius, data } = e.scene;
    this.setState({ width, height, radius, data });
  },
  render () {
    return (
      R.div(null,
        React.createElement(MultiLayerCanvas, {onMouseMove: this.handleMouseMove, onClick: this.handleClick, width: this.state.width, height: this.state.height, radius: this.state.radius, data: this.state.data, selectedTile: this.state.cursorHexCoords}),
        React.createElement(HSelectBox, {onChange: e => this.setState({selectedTileType: e.value}), data: Tile.types}),
        R.ul({className: 'centered tool-box'},
          R.li({className: 'tool'}, React.createElement(CoordBox, {caption: "Pix Coordinates", data: this.state.cursorPixCoords})),
          R.li({className: 'tool'}, React.createElement(CoordBox, {caption: "Hex Coordinates", data: this.state.cursorHexCoords}))
        ),
        React.createElement(Download, {onSceneChange: this.handleSceneChange, grid: {width: this.state.width, height: this.state.height, radius: this.state.radius, data: this.state.data}})
      )
    );
  }
});
});
