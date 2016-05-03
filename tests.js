"use strict";

const hexagon = require('./lib/hexagon');
const ECS = require('./lib/ecs');

const $ = document.querySelector.bind(document);

(function testHexagon () {
  const oddGrid = {width: 15, height:13, radius: 32};
  const evenGrid = {width: 15, height:12, radius: 32};
  QUnit.test("Test allCoords", assert => {
    const coordsCorrect = grid => Array.from(hexagon.grid.allCoords(grid.width, grid.height)).every(coord => assert.ok(hexagon.grid.contains(grid.width, grid.height, coord.x, coord.y), "Passed !"));
    const rightNumberCoords = grid => assert.strictEqual(Array.from(hexagon.grid.allCoords(grid.width, grid.height)).length, hexagon.grid.cellsNumber(grid.width, grid.height), "Passed !");
    coordsCorrect(oddGrid);
    coordsCorrect(evenGrid);
    rightNumberCoords(oddGrid);
    rightNumberCoords(evenGrid);
  });
})();
(function testECS () {
  const {Position, Movement, Drawable} = ECS.createFacetTypes({
    Position: {x: 0, y: 0},
    Movement: {x: 0, y: 0},
    Drawable: {color: 'rbg(0, 255, 0)'}
  });
  const successivePositions = [];
  const MovementProcessor = {
    needs: [Position, Movement],
    update (facets, e, delta) {
      const pos = facets.get(e, Position);
      const mov = facets.get(e, Movement);
      successivePositions.push(pos);
      facets.set(e, Position, {x: pos.x + mov.x * delta, y: pos.y + mov.y * delta});
    }
  };
  const stage = ECS.createStage([MovementProcessor], [
    [
      Position, {x: 0, y: 0},
      Movement, {x: 1, y: 0}
    ]
  ]);
  stage.step(1);
  stage.step(1);
  stage.step(1);
  QUnit.test("Test ECS", assert => {
    assert.deepEqual(successivePositions, [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}]);
  });
})();
