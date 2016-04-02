define(require => { "use strict";

const hexagon          = require('lib/hexagon');
const Immutable        = require('lib/immutable');
const HSelectBox       = require('lib/components/hselectbox');
const CoordBox         = require('lib/components/coordbox');
const MultiLayerCanvas = require('js/multilayercanvas');
const Download         = require('js/download');
const Tile             = require('js/tile');

const R = React.DOM;
const Point = Immutable.Record({x: 0, y: 0});

return React.createClass({displayName: 'MapEditor',
  getInitialState () {
    const tilesMap = Immutable.Map().withMutations(map => {
      for (let coord of hexagon.grid.allCoords({width: this.props.initialWidth, height: this.props.initialHeight})) {
        map.set(new Point(coord), 0);
      }
    });
    return {
      cursorPixCoords: new Point({x: 0, y: 0}),
      cursorHexCoords: new Point({x: 0, y: 0}),
      selectedTileType: 0,
      width: this.props.initialWidth,
      height: this.props.initialHeight,
      radius: this.props.initialRadius,
      tiles: tilesMap
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
      this.setState({tiles: this.state.tiles.set(new Point(obstacle), this.state.selectedTileType)});
    }
  },
  handleSceneChange (e) {
    const { width, height, radius, tiles } = e.scene;
    this.setState({ width, height, radius, tiles });
  },
  render () {
    return (
      R.div(null,
        React.createElement(Download, {onSceneChange: this.handleSceneChange,
          grid: {width: this.state.width, height: this.state.height, radius: this.state.radius, tiles: this.state.tiles}}),
        R.div({className: 'scene'},
          React.createElement(MultiLayerCanvas, {onMouseMove: this.handleMouseMove, onClick: this.handleClick,width: this.state.width, height: this.state.height,
            radius: this.state.radius, tiles: this.state.tiles, selectedTile: this.state.cursorHexCoords, selectedTileType: this.state.selectedTileType})
        ),
        React.createElement(HSelectBox, {onChange: e => this.setState({selectedTileType: e.value}), data: Tile.types}),
        R.ul({className: 'centered tool-box'},
          R.li({className: 'tool'}, React.createElement(CoordBox, {caption: "Pix Coordinates", data: this.state.cursorPixCoords.toObject()})),
          R.li({className: 'tool'}, React.createElement(CoordBox, {caption: "Hex Coordinates", data: this.state.cursorHexCoords.toObject()}))
        )
      )
    );
  }
});
});
