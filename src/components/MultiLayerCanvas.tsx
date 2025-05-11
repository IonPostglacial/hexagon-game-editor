import React, { useEffect, useRef } from 'react';
import { hexagon } from '../utils/hexagon';
import { tilesRendering, overlayRendering } from './renderer';
import type { GridType, PointType } from '../utils/types';

interface MultiLayerCanvasProps {
    grid: GridType;
    selectedTile: PointType;
    selectedTileType: number;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function MultiLayerCanvas({
    grid,
    selectedTile,
    selectedTileType,
    onClick,
    onMouseMove,
}: MultiLayerCanvasProps) {
    const layersRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!layersRef.current || layersRef.current.children.length < 3) return;
        const tilesLayer = layersRef.current.children[0];
        const overlayLayer = layersRef.current.children[2];
        if (!(tilesLayer instanceof HTMLCanvasElement) || !(overlayLayer instanceof HTMLCanvasElement)) return;
        const tilesCtx = tilesLayer.getContext('2d');
        const overlayCtx = overlayLayer.getContext('2d');
        if (!tilesCtx || !overlayCtx) return;
        const renderTiles = tilesRendering(tilesCtx);
        const renderOverlay = overlayRendering(
            overlayCtx,
            selectedTile,
            selectedTileType
        );

        const drawScene = () => {
            renderTiles(grid);
            renderOverlay(grid.radius, selectedTile, selectedTileType);
        };

        drawScene();
    }, [grid, selectedTile, selectedTileType]);

    const pixWidth = Math.ceil(hexagon.grid.pixelWidth(grid.width, grid.radius));
    const pixHeight = Math.ceil(hexagon.grid.pixelHeight(grid.height, grid.radius));

    return (
        <div
            onClick={onClick}
            onMouseMove={onMouseMove}
            ref={layersRef}
            style={{ width: pixWidth, height: pixHeight }}
            className="layers"
        >
            <canvas
                className="layer checkboard"
                width={pixWidth}
                height={pixHeight}
            >
                This page is useless without canvas
            </canvas>
            <canvas className="layer" width={pixWidth} height={pixHeight}>
                This page is useless without canvas
            </canvas>
            <canvas className="layer" width={pixWidth} height={pixHeight}>
                This page is useless without canvas
            </canvas>
        </div>
    );
}