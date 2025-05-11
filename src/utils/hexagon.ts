const SQRT3 = Math.sqrt(3);

type Point = { x: number; y: number };

type Grid = {
    radius: number;
    width: number;
    height: number;
}

export const hexagon = {
    area(radius: number) {
        return 1.5 * SQRT3 * radius * radius;
    },
    corners(center: Point, radius: number) {
        const H_OFFSET = SQRT3 * 0.5 * radius;
        const V_OFFSET = radius * 0.5;
        return [
            { x: center.x - H_OFFSET, y: center.y - V_OFFSET },
            { x: center.x, y: center.y - radius },
            { x: center.x + H_OFFSET, y: center.y - V_OFFSET },
            { x: center.x + H_OFFSET, y: center.y + V_OFFSET },
            { x: center.x, y: center.y + radius },
            { x: center.x - H_OFFSET, y: center.y + V_OFFSET }
        ];
    },
    path(ctx: CanvasRenderingContext2D, center: Point, radius: number) {
        const CORNERS = hexagon.corners(center, radius);
        ctx.moveTo(CORNERS[5].x, CORNERS[5].y);
        for (var corner of CORNERS) {
            ctx.lineTo(corner.x, corner.y);
        }
    },
    grid: {
        pixelWidth(width: number, radius: number) {
            return SQRT3 * width * radius;
        },
        pixelHeight(height: number, radius: number) {
            return (1.5 * height + 0.5) * radius;
        },
        pixelToAxis(x: number, y: number, radius: number) {
            const WIDTH_NUM = Math.floor(x / (SQRT3 * 0.5 * radius));
            const HEIGHT_NUM = Math.floor(y / (0.5 * radius));
            const HEX_Y = Math.floor(HEIGHT_NUM / 3);
            const HEX_X = Math.floor(0.5 * (WIDTH_NUM - HEX_Y));
            return { x: HEX_X, y: HEX_Y };
        },
        axisToPixel(x: number, y: number, radius: number) {
            const PIX_Y = radius + 1.5 * radius * y;
            const PIX_X = (PIX_Y - radius) / SQRT3 + SQRT3 * radius * (x + 0.5);
            return { x: PIX_X, y: PIX_Y };
        },
        contains(width: number, height: number, x: number, y: number) {
            return Math.floor(x + 0.5 * y) >= 0 && Math.ceil(x + 0.5 * y) < width && y >= 0 && y < height;
        },
        cellsNumber(width: number, height: number) {
            return Math.ceil(0.5 * height) * width + Math.floor(0.5 * height) * (width - 1);
        },
        allCoords(width: number, height: number) {
            return {
                *[Symbol.iterator]() {
                    for (var y = 0; y < height; y++) {
                        for (var x = 0; x < width - 1; x++) {
                            yield { x: Math.ceil(x - 0.5 * y), y: y };
                        }
                        if (y % 2 === 0) { yield { x: Math.floor(x - 0.5 * y), y }; }
                    }
                }
            }
        },
        draw(ctx: CanvasRenderingContext2D, grid: Grid, style: string) {
            const HEX_WIDTH = SQRT3 * grid.radius;
            const HEX_HEIGHT = 2 * grid.radius;
            const LAST_Y = (1.5 * grid.height + 1) * grid.radius;
            var x = 0;
            ctx.strokeStyle = style;
            ctx.beginPath();
            for (var y = 0.5 * grid.radius; y < LAST_Y; y += 1.5 * HEX_HEIGHT) {
                for (x = 0; x < HEX_WIDTH * grid.width; x += HEX_WIDTH) {
                    ctx.moveTo(x, y + grid.radius);
                    ctx.lineTo(x, y);
                    ctx.lineTo(x + 0.5 * HEX_WIDTH, y - 0.5 * grid.radius);
                    ctx.lineTo(x + HEX_WIDTH, y);
                    ctx.moveTo(x, y + grid.radius);
                    ctx.lineTo(x + 0.5 * HEX_WIDTH, y + 1.5 * grid.radius);
                    if (y < LAST_Y - 1.5 * HEX_HEIGHT) {
                        ctx.lineTo(x + 0.5 * HEX_WIDTH, y + 2.5 * grid.radius);
                        ctx.moveTo(x + 0.5 * HEX_WIDTH, y + 1.5 * grid.radius);
                    }
                    ctx.lineTo(x + HEX_WIDTH, y + grid.radius);
                }
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }
}