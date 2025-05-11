import React, { useState, useEffect } from 'react';
import { MultiValueButton, ButtonValue } from 'hextk';
import { hexagon } from '../utils/hexagon';
import { Map as ImmutableMap, Record } from 'immutable';
import MultiLayerCanvas from './MultiLayerCanvas';
import ActionBar from './ActionBar';
import { Tile } from './tile';
import type { GridType, PointType } from '../utils/types';


const Point = Record({ x: 0, y: 0 });

const Grid = Record({
  width: 0,
  height: 0,
  radius: 0,
  tiles: ImmutableMap<PointType, number>(),
});

interface MapEditorProps {
  initialWidth: number;
  initialHeight: number;
  initialRadius: number;
}

export default function MapEditor({ initialWidth, initialHeight, initialRadius }: MapEditorProps) {
  const [cursorPixCoords, setCursorPixCoords] = useState<PointType>(new Point({ x: 0, y: 0 }));
  const [cursorHexCoords, setCursorHexCoords] = useState<PointType>(new Point({ x: 0, y: 0 }));
  const [selectedTileType, setSelectedTileType] = useState<number>(0);
  const [grid, setGrid] = useState<GridType>(
    new Grid({
      width: initialWidth,
      height: initialHeight,
      radius: initialRadius,
    })
  );

  const gridHistory: GridType[] = [];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        // ctrl+z
        const previousGrid = gridHistory.pop();
        if (previousGrid !== undefined) {
          setGrid(previousGrid);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [gridHistory]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const event = e.nativeEvent;
    const hexCoords = hexagon.grid.pixelToAxis(event.offsetX, event.offsetY, grid.radius);
    if (hexagon.grid.contains(grid.width, grid.height, hexCoords.x, hexCoords.y)) {
      setCursorPixCoords(new Point({ x: event.offsetX, y: event.offsetY }));
      setCursorHexCoords(new Point(hexCoords));
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const event = e.nativeEvent;
    const obstacle = hexagon.grid.pixelToAxis(event.offsetX, event.offsetY, grid.radius);
    const newTiles = grid.tiles.set(new Point(obstacle), selectedTileType);
    if (hexagon.grid.contains(grid.width, grid.height, obstacle.x, obstacle.y)) {
      gridHistory.push(grid);
      setGrid(grid.set('tiles', newTiles));
    }
  };

  const handleSceneChange = (e: { scene: { width: number; height: number; radius: number; tiles: Immutable.Map<PointType, number> } }) => {
    const { width, height, radius, tiles } = e.scene;
    gridHistory.push(grid);
    setGrid(
      grid.withMutations((newGrid) =>
        newGrid.set('width', width).set('height', height).set('radius', radius).set('tiles', tiles)
      )
    );
  };

  return (
    <div className="main-view">
      <ActionBar onSceneChange={handleSceneChange} grid={grid} />
      <div className="scene">
        <MultiLayerCanvas
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          selectedTile={cursorHexCoords}
          selectedTileType={selectedTileType}
          grid={grid}
        />
      </div>
      <MultiValueButton
        onChange={(e: { value: number }) => setSelectedTileType(e.value)}
        data={Tile.types}
      >
        {Tile.types.map((type) => (
          <ButtonValue {...type} key={type.label} />
        ))}
      </MultiValueButton>
    </div>
  );
}