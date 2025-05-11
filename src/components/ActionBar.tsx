import React, { useState, useEffect, useRef } from 'react';
import { PushButton, Popover, MenuEntry } from 'hextk';
import { Map as ImmutableMap, Record } from 'immutable';
import { hexagon } from '../utils/hexagon';
import type { PointType } from '../utils/types';

const Point = Record({ x: 0, y: 0 });

function gridToJson({ width, height, radius, tiles }: { width: number; height: number; radius: number; tiles: Immutable.Map<any, any> }) {
  const data: PointType[] = [];
  const valueGrid = { width, height, radius, tiles: data };
  for (let coord of hexagon.grid.allCoords(width, height)) {
    data.push(tiles.get(new Point(coord)));
  }
  return JSON.stringify(valueGrid);
}

function gridFromJson(json: string) {
  const grid = JSON.parse(json);
  const tiles = ImmutableMap().withMutations((map) => {
    let i = 0;
    for (let coord of hexagon.grid.allCoords(grid.width, grid.height)) {
      if (grid.tiles[i] !== null) {
        map.set(new Point(coord), grid.tiles[i]);
      }
      i++;
    }
  });
  grid.tiles = tiles;
  return grid;
}

interface ActionBarProps {
  grid: { width: number; height: number; radius: number; tiles: Immutable.Map<any, any> };
  onSceneChange: (data: { scene: any }) => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ grid, onSceneChange }) => {
  const [downloadLink, setDownloadLink] = useState<string | undefined>(undefined);
  const uploadedRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const uploaded = Object.assign(document.createElement('input'), { type: 'file', style: 'display:none' });
    uploaded.onchange = (e: Event) => {
      const READER = new FileReader();
      READER.onload = (e) => {
        if (READER.result) {
          onSceneChange({ scene: gridFromJson(READER.result as string) });
        }
      };
      if (uploaded.files && uploaded.files[0]) {
        READER.readAsText(uploaded.files[0]);
      }
    };
    uploadedRef.current = uploaded;
    document.getElementById('editor')?.appendChild(uploaded);

    return () => {
      if (uploadedRef.current) {
        document.getElementById('editor')?.removeChild(uploadedRef.current);
      }
    };
  }, [onSceneChange]);

  const handleLoad = () => {
    const scene = localStorage.scene;
    if (scene) {
      onSceneChange({ scene: gridFromJson(scene) });
    }
  };

  const handleSave = () => {
    localStorage.scene = gridToJson(grid);
  };

  const handleUpload = () => {
    uploadedRef.current?.click();
  };

  const handleDownload = () => {
    const blob = new Blob([gridToJson(grid)], { type: 'application/json' });
    setDownloadLink(URL.createObjectURL(blob));
  };

  return (
    <div className="centered tool-box">
      <PushButton
        icon="fa-download"
        label="Download current stage"
        href={downloadLink}
        download="scene.json"
        onClick={handleDownload}
      />
      <PushButton icon="fa-clone" label="Snapshot" onClick={handleSave} />
      <PushButton icon="fa-undo" label="Restore" onClick={handleLoad} />
      <Popover label="Load">
        <MenuEntry icon="fa-globe" label="Stage" onClick={handleUpload} />
        <MenuEntry icon="fa-file-image-o" label="Tileset" />
        <MenuEntry icon="fa-cubes" label="Components" />
      </Popover>
    </div>
  );
};

export default ActionBar;