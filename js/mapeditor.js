define(require => { "use strict";

const hexagon          = require('lib/hexagon');
const Immutable        = require('lib/immutable');
const HSelectBox       = require('lib/components/hselectbox');
const CoordBox         = require('lib/components/coordbox');
const PushButton       = require('lib/components/pushbutton');
const MultiLayerCanvas = require('js/multilayercanvas');
const ActionBar        = require('js/actionbar');
const Tile             = require('js/tile');

const R = React.DOM;
const Point = Immutable.Record({x: 0, y: 0});
const $ = document.querySelector.bind(document);
const $all = document.querySelectorAll.bind(document);

return React.createClass({displayName: 'MapEditor',
  tilesHistory: [],
  componentDidMount () {
    document.addEventListener('keydown', this.handleKeyPress);
    function adaptSceneHeight (e) {
      const totalToolboxesHeight = Array.prototype.map.call($all('.main-view > .tool-box'), bar => bar.offsetHeight).reduce((h1, h2) => h1 + h2);
      $('.scene').style.height = window.innerHeight - totalToolboxesHeight + "px";
    }
    window.addEventListener('resize', adaptSceneHeight);
    adaptSceneHeight();
  },
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
    const newTiles = this.state.tiles.set(new Point(obstacle), this.state.selectedTileType);
    if (hexagon.grid.contains(this.state, obstacle.x, obstacle.y)) {
      this.tilesHistory.push(this.state.tiles);
      this.setState({tiles: newTiles});
    }
  },
  handleKeyPress (e) {
    if (e.ctrlKey) {
      switch (e.which) {
      case 90: // ctrl+z
        const previousTiles = this.tilesHistory.pop();
        if (previousTiles !== undefined) {
          this.setState({tiles: previousTiles});
        }
        break;
      }
    }

  },
  handleSceneChange (e) {
    const { width, height, radius, tiles } = e.scene;
    this.setState({ width, height, radius, tiles });
  },
  render () {
    return (
      R.div({className: 'main-view'},
        React.createElement(ActionBar, {onSceneChange: this.handleSceneChange,
          grid: {width: this.state.width, height: this.state.height, radius: this.state.radius, tiles: this.state.tiles}}),
        R.div({className: 'scene'},
          React.createElement(MultiLayerCanvas, {onMouseMove: this.handleMouseMove, onClick: this.handleClick,
            width: this.state.width, height: this.state.height, radius: this.state.radius, tiles: this.state.tiles,
            selectedTile: this.state.cursorHexCoords, selectedTileType: this.state.selectedTileType})
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
