hexagon = (() => {
  "use strict";

  let hexagon = {
    area(radius) {
      return 1.5 * Math.sqrt(3) * radius * radius;
    },
    corners(center, radius) {
      const H_OFFSET = Math.sqrt(3) * 0.5 * radius;
      const V_OFFSET = radius / 2;
      return [
        {x: center.x - H_OFFSET, y: center.y - V_OFFSET},
        {x: center.x, y: center.y - radius},
        {x: center.x + H_OFFSET, y: center.y - V_OFFSET},
        {x: center.x + H_OFFSET, y: center.y + V_OFFSET},
        {x: center.x, y: center.y + radius},
        {x: center.x - H_OFFSET, y: center.y + V_OFFSET}
      ];
    },
    draw(ctx, center, radius, style) {
      const CORNERS = hexagon.corners(center, radius);
      ctx.strokeStyle = style;
      ctx.beginPath();
      ctx.moveTo(CORNERS[5].x, CORNERS[5].y);
      for (let corner of CORNERS) {
        ctx.lineTo(corner.x, corner.y);
      }
      ctx.stroke();
    }
  }

  hexagon.grid = {
    pixelWidth(grid) {
      return Math.sqrt(3) * grid.radius * grid.width;
    },
    pixelHeight(grid) {
      return (3 * grid.height - 1) * grid.radius;
    },
    pixelToAxis(grid, x, y) {
      const WIDTH_NUM = Math.floor(x / (Math.sqrt(3) * 0.5 * grid.radius));
      const HEIGHT_NUM = Math.floor(y / (0.5 * grid.radius));
      const HEX_Y = Math.floor(HEIGHT_NUM / 3);
      const HEX_X = Math.floor(0.5 * (WIDTH_NUM - HEX_Y));
      return {x: HEX_X, y: HEX_Y};
    },
    axisToPixel(grid, x, y) {
      const PIX_Y = grid.radius + 1.5 * grid.radius * y;
      const PIX_X = (PIX_Y - grid.radius) / Math.sqrt(3) + Math.sqrt(3) * grid.radius * (x + 0.5);
      return {x: PIX_X, y: PIX_Y};
    },
    draw(ctx, grid, style) {
      const HEX_WIDTH = Math.sqrt(3) * grid.radius;
      const HEX_HEIGHT = 2 * grid.radius;
      const LAST_Y = (0.5 + 3 * grid.height) * grid.radius;
      let x = 0;
      ctx.strokeStyle = style;
      ctx.beginPath();
      for (let y = 0.5 * grid.radius; y < LAST_Y; y += 1.5 * HEX_HEIGHT) {
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
})();
