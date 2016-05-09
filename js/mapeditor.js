"use strict";

const { MultiValueButton, ButtonValue, PushButton } = require('hextk');
const React            = require('react');
const ReactDOM         = require('react-dom');
const hexagon          = require('../lib/hexagon');
const Immutable        = require('immutable');
const MultiLayerCanvas = require('./multilayercanvas');
const ActionBar        = require('./actionbar');
const Tile             = require('./tile');

const R = React.DOM;
const Point = Immutable.Record({x: 0, y: 0});
const Grid  = Immutable.Record({width: 0, height: 0, radius: 0, tiles: Immutable.Map()});

module.exports = React.createClass({displayName: 'MapEditor',
  gridHistory: [],
  componentDidMount () {
    document.addEventListener('keydown', this.handleKeyPress);
  },
  getInitialState () {
    return {
      cursorPixCoords: new Point({x: 0, y: 0}),
      cursorHexCoords: new Point({x: 0, y: 0}),
      selectedTileType: 0,
      grid: new Grid({
        width: this.props.initialWidth,
        height: this.props.initialHeight,
        radius: this.props.initialRadius
      })
    };
  },
  handleMouseMove (e) {
    const event = e.nativeEvent;
    const hexCoords = hexagon.grid.pixelToAxis(event.offsetX, event.offsetY, this.state.grid.radius);
    if (hexagon.grid.contains(this.state.grid.width, this.state.grid.height, hexCoords.x, hexCoords.y)) {
      this.setState({
        cursorPixCoords: new Point({x: event.offsetX, y: event.offsetY}),
        cursorHexCoords: new Point(hexCoords)
      });
    }
  },
  handleClick (e) {
    const event = e.nativeEvent;
    const obstacle = hexagon.grid.pixelToAxis(event.offsetX, event.offsetY, this.state.grid.radius);
    const newTiles = this.state.grid.tiles.set(new Point(obstacle), this.state.selectedTileType);
    if (hexagon.grid.contains(this.state.grid.width, this.state.grid.height, obstacle.x, obstacle.y)) {
      this.gridHistory.push(this.state.grid);
      this.setState({grid: this.state.grid.set('tiles', newTiles)});
    }
  },
  handleKeyPress (e) {
    if (e.ctrlKey) {
      switch (e.which) {
      case 90: // ctrl+z
        const previousGrid = this.gridHistory.pop();
        if (previousGrid !== undefined) {
          this.setState({grid: previousGrid});
        }
        break;
      }
    }
  },
  handleSceneChange (e) {
    const { width, height, radius, tiles } = e.scene;
    this.gridHistory.push(this.state.grid);
    this.setState({grid: this.state.grid.withMutations(newGrid =>
      newGrid.set('width', width).set('height', height).set('radius', radius).set('tiles', tiles)
    )});
  },
  render () {
    return (
      R.div({className: 'main-view'},
        React.createElement(ActionBar, {onSceneChange: this.handleSceneChange,
          grid: this.state.grid}),
        R.div({className: 'scene'},
          React.createElement(MultiLayerCanvas, {
            onMouseMove: this.handleMouseMove, onClick: this.handleClick,
            selectedTile: this.state.cursorHexCoords, selectedTileType: this.state.selectedTileType,
            grid: this.state.grid
          })
        ),
        React.createElement(MultiValueButton, {onChange: e => this.setState({selectedTileType: e.value}), data: Tile.types},
          Tile.types.map(type => React.createElement(ButtonValue, Object.assign(type, {key: type.label})))
        )
      )
    );
  }
});
