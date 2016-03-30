define(require => { "use strict";

const SQRT3 = Math.sqrt(3);

const hexagon = {
  area(radius) {
    return 1.5 * SQRT3 * radius * radius;
  },
  corners(center, radius) {
    const H_OFFSET = SQRT3 * 0.5 * radius;
    const V_OFFSET = radius * 0.5;
    return [
      {x: center.x - H_OFFSET, y: center.y - V_OFFSET},
      {x: center.x, y: center.y - radius},
      {x: center.x + H_OFFSET, y: center.y - V_OFFSET},
      {x: center.x + H_OFFSET, y: center.y + V_OFFSET},
      {x: center.x, y: center.y + radius},
      {x: center.x - H_OFFSET, y: center.y + V_OFFSET}
    ];
  },
  path(ctx, center, radius) {
    const CORNERS = hexagon.corners(center, radius);
    ctx.moveTo(CORNERS[5].x, CORNERS[5].y);
    for (var corner of CORNERS) {
      ctx.lineTo(corner.x, corner.y);
    }
  }
}

hexagon.grid = {
  pixelWidth(grid) {
    return SQRT3 * grid.radius * grid.width;
  },
  pixelHeight(grid) {
    return (1.5 * grid.height + 0.5) * grid.radius;
  },
  pixelToAxis(grid, x, y) {
    const WIDTH_NUM = Math.floor(x / (SQRT3 * 0.5 * grid.radius));
    const HEIGHT_NUM = Math.floor(y / (0.5 * grid.radius));
    const HEX_Y = Math.floor(HEIGHT_NUM / 3);
    const HEX_X = Math.floor(0.5 * (WIDTH_NUM - HEX_Y));
    return {x: HEX_X, y: HEX_Y};
  },
  axisToPixel(grid, x, y) {
    const PIX_Y = grid.radius + 1.5 * grid.radius * y;
    const PIX_X = (PIX_Y - grid.radius) / SQRT3 + SQRT3 * grid.radius * (x + 0.5);
    return {x: PIX_X, y: PIX_Y};
  },
  contains(grid, x, y) {
    return Math.floor(x + 0.5 * y) >= 0 && Math.ceil(x + 0.5 * y) < grid.width && y >= 0 && y < grid.height;
  },
  cellsNumber(grid) {
    return Math.ceil(0.5 * grid.height) * grid.width + Math.floor(0.5 * grid.height) * (grid.width - 1);
  },
  allCoords(grid) {
    return {
      *[Symbol.iterator]() {
        for (var y = 0; y < grid.height; y++) {
          for (var x = 0; x < grid.width - 1; x++) {
            yield {x: Math.ceil(x - 0.5 * y), y: y};
          }
          if (y % 2 === 0) { yield {x: Math.floor(x - 0.5 * y), y}; }
        }
      }
    }
  },
  draw(ctx, grid, style) {
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
};
return hexagon;
});
