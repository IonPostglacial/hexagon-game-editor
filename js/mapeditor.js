define(["lib/hexagon", "lib/immutable", "lib/hexmap", "js/hselectbox", "js/coordbox", "js/multilayercanvas", "js/download", "js/tile"],
  (hexagon, Immutable, HexMap, HSelectBox, CoordBox, MultiLayerCanvas, Download, Tile) => {
"use strict";

const R = React.DOM;
const Point = Immutable.Record({x: 0, y: 0});

return React.createClass({displayName: 'MapEditor',
  getInitialState () {
    return {
      cursorPixCoords: new Point({x: 0, y: 0}),
      cursorHexCoords: new Point({x: 0, y: 0}),
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
        cursorPixCoords: new Point({x: event.offsetX, y: event.offsetY}),
        cursorHexCoords: new Point(hexCoords)
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
          R.li({className: 'tool'}, React.createElement(CoordBox, {caption: "Pix Coordinates", data: this.state.cursorPixCoords.toObject()})),
          R.li({className: 'tool'}, React.createElement(CoordBox, {caption: "Hex Coordinates", data: this.state.cursorHexCoords.toObject()}))
        ),
        React.createElement(Download, {onSceneChange: this.handleSceneChange, grid: {width: this.state.width, height: this.state.height, radius: this.state.radius, data: this.state.data}})
      )
    );
  }
});
});
