(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

function createEntityContainer () {
  const entities = []; // TODO: Implement an efficient storage for facets.
  const entitiesFacetsMask = [];
  const entityRecycleBin = [];
  let lastEntityId = 0;

  function addFacet(e, facetType, facet) {
    entitiesFacetsMask[e] |= 1 << facetType;
    entities[e][facetType] = facet;
  }
  function removeFacet(e, facetType) {
    entitiesFacetsMask[e] &= ~(1 << facetType);
    delete entities[e][facetType];
  }
  function getFacet (e, facetType) {
    return entities[e][facetType];
  }
  return {
    create (facets) {
      let entityId = entityRecycleBin.pop(); // If an entity was removed, its ID is reused in priority.
      if (entityId === undefined) { entityId = lastEntityId++; } // Otherwise we create a new Id.
      entities[entityId] = [];
      entitiesFacetsMask[entityId] = 0;
      for (let i = 0; i < facets.length; i += 2) { // facets contains facetTypes and values
        addFacet(entityId, facets[i], facets[i + 1]);
      }
      return entityId;
    },
    remove (e) {
      entities[e] = undefined;
      entityRecycleBin.push(e);
    },
    *processableBy (processor) {
      for (let entity = 0; entity < entities.length; entity++) {
        if (entities[entity] !== undefined && ((processor.needsMask & ~entitiesFacetsMask[entity]) === 0)) {
          yield entity;
        }
      }
    },
    addFacet, removeFacet, getFacet
  }
}

function createFacetTypes (initialStates) { // FacetTypes are Ids corresponding to an aspect of an entity.
  if (Object.keys(initialStates).length === 32) { throw "The number of facet types is limited to 32."; }
  const types = {};
  Object.keys(initialStates).forEach((type, index) => types[type] = index);
  return types;
}

function createProcessor (entities, {needs, load, drop, prepare, update}) {
  const facetsAccessors = { // These functions are used in the processor definition to retrieve Facets.
    get (entity, facetType) { return entities.getFacet(entity, facetType); },
    set (entity, facetType, facet) { entities.addFacet(entity, facetType, facet); },
    del (entity, facetType) { entities.removeFacet(entity, facetType); }
  };
  update = update || (_=>_);
  return { // needsMask is a bitset containing 1 in places corresponding to FacetTypes the processor needs.
    needsMask: (needs || []).reduce((needsMask, elt) => needsMask |= 1 << elt, 0),
    load: load || (_=>_), drop: drop || (_=>_), prepare: prepare || (_=>_),
    update (e, delta) { update(facetsAccessors, e, delta); }
  };
}

function createWorld (processorsProperties, entitiesFacets) {
  const entities = createEntityContainer();
  const processors = processorsProperties.map(processorProperties => createProcessor(entities, processorProperties));
  entitiesFacets.forEach(entityFacets => entities.create(entityFacets));
  return {
    load () {
      processors.forEach(processor => processor.load());
    },
    drop () {
      processors.forEach(processor => processor.drop());
    },
    step (delta) {
      for (let processor of processors) {
        processor.prepare(delta);
        for (let entity of entities.processableBy(processor)) {
          processor.update(entity, delta);
        }
      }
    }
  }
}

module.exports = {createFacetTypes, createWorld};

},{}],2:[function(require,module,exports){
"use strict";

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
  pixelWidth(width, radius) {
    return SQRT3 * width * radius;
  },
  pixelHeight(height, radius) {
    return (1.5 * height + 0.5) * radius;
  },
  pixelToAxis(x, y, radius) {
    const WIDTH_NUM = Math.floor(x / (SQRT3 * 0.5 * radius));
    const HEIGHT_NUM = Math.floor(y / (0.5 * radius));
    const HEX_Y = Math.floor(HEIGHT_NUM / 3);
    const HEX_X = Math.floor(0.5 * (WIDTH_NUM - HEX_Y));
    return {x: HEX_X, y: HEX_Y};
  },
  axisToPixel(x, y, radius) {
    const PIX_Y = radius + 1.5 * radius * y;
    const PIX_X = (PIX_Y - radius) / SQRT3 + SQRT3 * radius * (x + 0.5);
    return {x: PIX_X, y: PIX_Y};
  },
  contains(width, height, x, y) {
    return Math.floor(x + 0.5 * y) >= 0 && Math.ceil(x + 0.5 * y) < width && y >= 0 && y < height;
  },
  cellsNumber(width, height) {
    return Math.ceil(0.5 * height) * width + Math.floor(0.5 * height) * (width - 1);
  },
  allCoords(width, height) {
    return {
      *[Symbol.iterator]() {
        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width - 1; x++) {
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
module.exports = hexagon;

},{}],3:[function(require,module,exports){
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
  const world = ECS.createWorld([MovementProcessor], [
    [
      Position, {x: 0, y: 0},
      Movement, {x: 1, y: 0}
    ]
  ]);
  world.step(1);
  world.step(1);
  world.step(1);
  QUnit.test("Test ECS", assert => {
    assert.deepEqual(successivePositions, [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}]);
  });
})();

},{"./lib/ecs":1,"./lib/hexagon":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvZWNzLmpzIiwibGliL2hleGFnb24uanMiLCJ0ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBjcmVhdGVFbnRpdHlDb250YWluZXIgKCkge1xuICBjb25zdCBlbnRpdGllcyA9IFtdOyAvLyBUT0RPOiBJbXBsZW1lbnQgYW4gZWZmaWNpZW50IHN0b3JhZ2UgZm9yIGZhY2V0cy5cbiAgY29uc3QgZW50aXRpZXNGYWNldHNNYXNrID0gW107XG4gIGNvbnN0IGVudGl0eVJlY3ljbGVCaW4gPSBbXTtcbiAgbGV0IGxhc3RFbnRpdHlJZCA9IDA7XG5cbiAgZnVuY3Rpb24gYWRkRmFjZXQoZSwgZmFjZXRUeXBlLCBmYWNldCkge1xuICAgIGVudGl0aWVzRmFjZXRzTWFza1tlXSB8PSAxIDw8IGZhY2V0VHlwZTtcbiAgICBlbnRpdGllc1tlXVtmYWNldFR5cGVdID0gZmFjZXQ7XG4gIH1cbiAgZnVuY3Rpb24gcmVtb3ZlRmFjZXQoZSwgZmFjZXRUeXBlKSB7XG4gICAgZW50aXRpZXNGYWNldHNNYXNrW2VdICY9IH4oMSA8PCBmYWNldFR5cGUpO1xuICAgIGRlbGV0ZSBlbnRpdGllc1tlXVtmYWNldFR5cGVdO1xuICB9XG4gIGZ1bmN0aW9uIGdldEZhY2V0IChlLCBmYWNldFR5cGUpIHtcbiAgICByZXR1cm4gZW50aXRpZXNbZV1bZmFjZXRUeXBlXTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGNyZWF0ZSAoZmFjZXRzKSB7XG4gICAgICBsZXQgZW50aXR5SWQgPSBlbnRpdHlSZWN5Y2xlQmluLnBvcCgpOyAvLyBJZiBhbiBlbnRpdHkgd2FzIHJlbW92ZWQsIGl0cyBJRCBpcyByZXVzZWQgaW4gcHJpb3JpdHkuXG4gICAgICBpZiAoZW50aXR5SWQgPT09IHVuZGVmaW5lZCkgeyBlbnRpdHlJZCA9IGxhc3RFbnRpdHlJZCsrOyB9IC8vIE90aGVyd2lzZSB3ZSBjcmVhdGUgYSBuZXcgSWQuXG4gICAgICBlbnRpdGllc1tlbnRpdHlJZF0gPSBbXTtcbiAgICAgIGVudGl0aWVzRmFjZXRzTWFza1tlbnRpdHlJZF0gPSAwO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmYWNldHMubGVuZ3RoOyBpICs9IDIpIHsgLy8gZmFjZXRzIGNvbnRhaW5zIGZhY2V0VHlwZXMgYW5kIHZhbHVlc1xuICAgICAgICBhZGRGYWNldChlbnRpdHlJZCwgZmFjZXRzW2ldLCBmYWNldHNbaSArIDFdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbnRpdHlJZDtcbiAgICB9LFxuICAgIHJlbW92ZSAoZSkge1xuICAgICAgZW50aXRpZXNbZV0gPSB1bmRlZmluZWQ7XG4gICAgICBlbnRpdHlSZWN5Y2xlQmluLnB1c2goZSk7XG4gICAgfSxcbiAgICAqcHJvY2Vzc2FibGVCeSAocHJvY2Vzc29yKSB7XG4gICAgICBmb3IgKGxldCBlbnRpdHkgPSAwOyBlbnRpdHkgPCBlbnRpdGllcy5sZW5ndGg7IGVudGl0eSsrKSB7XG4gICAgICAgIGlmIChlbnRpdGllc1tlbnRpdHldICE9PSB1bmRlZmluZWQgJiYgKChwcm9jZXNzb3IubmVlZHNNYXNrICYgfmVudGl0aWVzRmFjZXRzTWFza1tlbnRpdHldKSA9PT0gMCkpIHtcbiAgICAgICAgICB5aWVsZCBlbnRpdHk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGFkZEZhY2V0LCByZW1vdmVGYWNldCwgZ2V0RmFjZXRcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVGYWNldFR5cGVzIChpbml0aWFsU3RhdGVzKSB7IC8vIEZhY2V0VHlwZXMgYXJlIElkcyBjb3JyZXNwb25kaW5nIHRvIGFuIGFzcGVjdCBvZiBhbiBlbnRpdHkuXG4gIGlmIChPYmplY3Qua2V5cyhpbml0aWFsU3RhdGVzKS5sZW5ndGggPT09IDMyKSB7IHRocm93IFwiVGhlIG51bWJlciBvZiBmYWNldCB0eXBlcyBpcyBsaW1pdGVkIHRvIDMyLlwiOyB9XG4gIGNvbnN0IHR5cGVzID0ge307XG4gIE9iamVjdC5rZXlzKGluaXRpYWxTdGF0ZXMpLmZvckVhY2goKHR5cGUsIGluZGV4KSA9PiB0eXBlc1t0eXBlXSA9IGluZGV4KTtcbiAgcmV0dXJuIHR5cGVzO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQcm9jZXNzb3IgKGVudGl0aWVzLCB7bmVlZHMsIGxvYWQsIGRyb3AsIHByZXBhcmUsIHVwZGF0ZX0pIHtcbiAgY29uc3QgZmFjZXRzQWNjZXNzb3JzID0geyAvLyBUaGVzZSBmdW5jdGlvbnMgYXJlIHVzZWQgaW4gdGhlIHByb2Nlc3NvciBkZWZpbml0aW9uIHRvIHJldHJpZXZlIEZhY2V0cy5cbiAgICBnZXQgKGVudGl0eSwgZmFjZXRUeXBlKSB7IHJldHVybiBlbnRpdGllcy5nZXRGYWNldChlbnRpdHksIGZhY2V0VHlwZSk7IH0sXG4gICAgc2V0IChlbnRpdHksIGZhY2V0VHlwZSwgZmFjZXQpIHsgZW50aXRpZXMuYWRkRmFjZXQoZW50aXR5LCBmYWNldFR5cGUsIGZhY2V0KTsgfSxcbiAgICBkZWwgKGVudGl0eSwgZmFjZXRUeXBlKSB7IGVudGl0aWVzLnJlbW92ZUZhY2V0KGVudGl0eSwgZmFjZXRUeXBlKTsgfVxuICB9O1xuICB1cGRhdGUgPSB1cGRhdGUgfHwgKF89Pl8pO1xuICByZXR1cm4geyAvLyBuZWVkc01hc2sgaXMgYSBiaXRzZXQgY29udGFpbmluZyAxIGluIHBsYWNlcyBjb3JyZXNwb25kaW5nIHRvIEZhY2V0VHlwZXMgdGhlIHByb2Nlc3NvciBuZWVkcy5cbiAgICBuZWVkc01hc2s6IChuZWVkcyB8fCBbXSkucmVkdWNlKChuZWVkc01hc2ssIGVsdCkgPT4gbmVlZHNNYXNrIHw9IDEgPDwgZWx0LCAwKSxcbiAgICBsb2FkOiBsb2FkIHx8IChfPT5fKSwgZHJvcDogZHJvcCB8fCAoXz0+XyksIHByZXBhcmU6IHByZXBhcmUgfHwgKF89Pl8pLFxuICAgIHVwZGF0ZSAoZSwgZGVsdGEpIHsgdXBkYXRlKGZhY2V0c0FjY2Vzc29ycywgZSwgZGVsdGEpOyB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVdvcmxkIChwcm9jZXNzb3JzUHJvcGVydGllcywgZW50aXRpZXNGYWNldHMpIHtcbiAgY29uc3QgZW50aXRpZXMgPSBjcmVhdGVFbnRpdHlDb250YWluZXIoKTtcbiAgY29uc3QgcHJvY2Vzc29ycyA9IHByb2Nlc3NvcnNQcm9wZXJ0aWVzLm1hcChwcm9jZXNzb3JQcm9wZXJ0aWVzID0+IGNyZWF0ZVByb2Nlc3NvcihlbnRpdGllcywgcHJvY2Vzc29yUHJvcGVydGllcykpO1xuICBlbnRpdGllc0ZhY2V0cy5mb3JFYWNoKGVudGl0eUZhY2V0cyA9PiBlbnRpdGllcy5jcmVhdGUoZW50aXR5RmFjZXRzKSk7XG4gIHJldHVybiB7XG4gICAgbG9hZCAoKSB7XG4gICAgICBwcm9jZXNzb3JzLmZvckVhY2gocHJvY2Vzc29yID0+IHByb2Nlc3Nvci5sb2FkKCkpO1xuICAgIH0sXG4gICAgZHJvcCAoKSB7XG4gICAgICBwcm9jZXNzb3JzLmZvckVhY2gocHJvY2Vzc29yID0+IHByb2Nlc3Nvci5kcm9wKCkpO1xuICAgIH0sXG4gICAgc3RlcCAoZGVsdGEpIHtcbiAgICAgIGZvciAobGV0IHByb2Nlc3NvciBvZiBwcm9jZXNzb3JzKSB7XG4gICAgICAgIHByb2Nlc3Nvci5wcmVwYXJlKGRlbHRhKTtcbiAgICAgICAgZm9yIChsZXQgZW50aXR5IG9mIGVudGl0aWVzLnByb2Nlc3NhYmxlQnkocHJvY2Vzc29yKSkge1xuICAgICAgICAgIHByb2Nlc3Nvci51cGRhdGUoZW50aXR5LCBkZWx0YSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7Y3JlYXRlRmFjZXRUeXBlcywgY3JlYXRlV29ybGR9O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IFNRUlQzID0gTWF0aC5zcXJ0KDMpO1xuXG5jb25zdCBoZXhhZ29uID0ge1xuICBhcmVhKHJhZGl1cykge1xuICAgIHJldHVybiAxLjUgKiBTUVJUMyAqIHJhZGl1cyAqIHJhZGl1cztcbiAgfSxcbiAgY29ybmVycyhjZW50ZXIsIHJhZGl1cykge1xuICAgIGNvbnN0IEhfT0ZGU0VUID0gU1FSVDMgKiAwLjUgKiByYWRpdXM7XG4gICAgY29uc3QgVl9PRkZTRVQgPSByYWRpdXMgKiAwLjU7XG4gICAgcmV0dXJuIFtcbiAgICAgIHt4OiBjZW50ZXIueCAtIEhfT0ZGU0VULCB5OiBjZW50ZXIueSAtIFZfT0ZGU0VUfSxcbiAgICAgIHt4OiBjZW50ZXIueCwgeTogY2VudGVyLnkgLSByYWRpdXN9LFxuICAgICAge3g6IGNlbnRlci54ICsgSF9PRkZTRVQsIHk6IGNlbnRlci55IC0gVl9PRkZTRVR9LFxuICAgICAge3g6IGNlbnRlci54ICsgSF9PRkZTRVQsIHk6IGNlbnRlci55ICsgVl9PRkZTRVR9LFxuICAgICAge3g6IGNlbnRlci54LCB5OiBjZW50ZXIueSArIHJhZGl1c30sXG4gICAgICB7eDogY2VudGVyLnggLSBIX09GRlNFVCwgeTogY2VudGVyLnkgKyBWX09GRlNFVH1cbiAgICBdO1xuICB9LFxuICBwYXRoKGN0eCwgY2VudGVyLCByYWRpdXMpIHtcbiAgICBjb25zdCBDT1JORVJTID0gaGV4YWdvbi5jb3JuZXJzKGNlbnRlciwgcmFkaXVzKTtcbiAgICBjdHgubW92ZVRvKENPUk5FUlNbNV0ueCwgQ09STkVSU1s1XS55KTtcbiAgICBmb3IgKHZhciBjb3JuZXIgb2YgQ09STkVSUykge1xuICAgICAgY3R4LmxpbmVUbyhjb3JuZXIueCwgY29ybmVyLnkpO1xuICAgIH1cbiAgfVxufVxuXG5oZXhhZ29uLmdyaWQgPSB7XG4gIHBpeGVsV2lkdGgod2lkdGgsIHJhZGl1cykge1xuICAgIHJldHVybiBTUVJUMyAqIHdpZHRoICogcmFkaXVzO1xuICB9LFxuICBwaXhlbEhlaWdodChoZWlnaHQsIHJhZGl1cykge1xuICAgIHJldHVybiAoMS41ICogaGVpZ2h0ICsgMC41KSAqIHJhZGl1cztcbiAgfSxcbiAgcGl4ZWxUb0F4aXMoeCwgeSwgcmFkaXVzKSB7XG4gICAgY29uc3QgV0lEVEhfTlVNID0gTWF0aC5mbG9vcih4IC8gKFNRUlQzICogMC41ICogcmFkaXVzKSk7XG4gICAgY29uc3QgSEVJR0hUX05VTSA9IE1hdGguZmxvb3IoeSAvICgwLjUgKiByYWRpdXMpKTtcbiAgICBjb25zdCBIRVhfWSA9IE1hdGguZmxvb3IoSEVJR0hUX05VTSAvIDMpO1xuICAgIGNvbnN0IEhFWF9YID0gTWF0aC5mbG9vcigwLjUgKiAoV0lEVEhfTlVNIC0gSEVYX1kpKTtcbiAgICByZXR1cm4ge3g6IEhFWF9YLCB5OiBIRVhfWX07XG4gIH0sXG4gIGF4aXNUb1BpeGVsKHgsIHksIHJhZGl1cykge1xuICAgIGNvbnN0IFBJWF9ZID0gcmFkaXVzICsgMS41ICogcmFkaXVzICogeTtcbiAgICBjb25zdCBQSVhfWCA9IChQSVhfWSAtIHJhZGl1cykgLyBTUVJUMyArIFNRUlQzICogcmFkaXVzICogKHggKyAwLjUpO1xuICAgIHJldHVybiB7eDogUElYX1gsIHk6IFBJWF9ZfTtcbiAgfSxcbiAgY29udGFpbnMod2lkdGgsIGhlaWdodCwgeCwgeSkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKHggKyAwLjUgKiB5KSA+PSAwICYmIE1hdGguY2VpbCh4ICsgMC41ICogeSkgPCB3aWR0aCAmJiB5ID49IDAgJiYgeSA8IGhlaWdodDtcbiAgfSxcbiAgY2VsbHNOdW1iZXIod2lkdGgsIGhlaWdodCkge1xuICAgIHJldHVybiBNYXRoLmNlaWwoMC41ICogaGVpZ2h0KSAqIHdpZHRoICsgTWF0aC5mbG9vcigwLjUgKiBoZWlnaHQpICogKHdpZHRoIC0gMSk7XG4gIH0sXG4gIGFsbENvb3Jkcyh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICpbU3ltYm9sLml0ZXJhdG9yXSgpIHtcbiAgICAgICAgZm9yICh2YXIgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xuICAgICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgd2lkdGggLSAxOyB4KyspIHtcbiAgICAgICAgICAgIHlpZWxkIHt4OiBNYXRoLmNlaWwoeCAtIDAuNSAqIHkpLCB5OiB5fTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHkgJSAyID09PSAwKSB7IHlpZWxkIHt4OiBNYXRoLmZsb29yKHggLSAwLjUgKiB5KSwgeX07IH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZHJhdyhjdHgsIGdyaWQsIHN0eWxlKSB7XG4gICAgY29uc3QgSEVYX1dJRFRIID0gU1FSVDMgKiBncmlkLnJhZGl1cztcbiAgICBjb25zdCBIRVhfSEVJR0hUID0gMiAqIGdyaWQucmFkaXVzO1xuICAgIGNvbnN0IExBU1RfWSA9ICgxLjUgKiBncmlkLmhlaWdodCArIDEpICogZ3JpZC5yYWRpdXM7XG4gICAgdmFyIHggPSAwO1xuICAgIGN0eC5zdHJva2VTdHlsZSA9IHN0eWxlO1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBmb3IgKHZhciB5ID0gMC41ICogZ3JpZC5yYWRpdXM7IHkgPCBMQVNUX1k7IHkgKz0gMS41ICogSEVYX0hFSUdIVCkge1xuICAgICAgZm9yICh4ID0gMDsgeCA8IEhFWF9XSURUSCAqIGdyaWQud2lkdGg7IHggKz0gSEVYX1dJRFRIKSB7XG4gICAgICAgIGN0eC5tb3ZlVG8oeCwgeSArIGdyaWQucmFkaXVzKTtcbiAgICAgICAgY3R4LmxpbmVUbyh4LCB5KTtcbiAgICAgICAgY3R4LmxpbmVUbyh4ICsgMC41ICogSEVYX1dJRFRILCB5IC0gMC41ICogZ3JpZC5yYWRpdXMpO1xuICAgICAgICBjdHgubGluZVRvKHggKyBIRVhfV0lEVEgsIHkpO1xuICAgICAgICBjdHgubW92ZVRvKHgsIHkgKyBncmlkLnJhZGl1cyk7XG4gICAgICAgIGN0eC5saW5lVG8oeCArIDAuNSAqIEhFWF9XSURUSCwgeSArIDEuNSAqIGdyaWQucmFkaXVzKTtcbiAgICAgICAgaWYgKHkgPCBMQVNUX1kgLSAxLjUgKiBIRVhfSEVJR0hUKSB7XG4gICAgICAgICAgY3R4LmxpbmVUbyh4ICsgMC41ICogSEVYX1dJRFRILCB5ICsgMi41ICogZ3JpZC5yYWRpdXMpO1xuICAgICAgICAgIGN0eC5tb3ZlVG8oeCArIDAuNSAqIEhFWF9XSURUSCwgeSArIDEuNSAqIGdyaWQucmFkaXVzKTtcbiAgICAgICAgfVxuICAgICAgICBjdHgubGluZVRvKHggKyBIRVhfV0lEVEgsIHkgKyBncmlkLnJhZGl1cyk7XG4gICAgICB9XG4gICAgICBjdHgubGluZVRvKHgsIHkpO1xuICAgIH1cbiAgICBjdHguc3Ryb2tlKCk7XG4gIH1cbn07XG5tb2R1bGUuZXhwb3J0cyA9IGhleGFnb247XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgaGV4YWdvbiA9IHJlcXVpcmUoJy4vbGliL2hleGFnb24nKTtcbmNvbnN0IEVDUyA9IHJlcXVpcmUoJy4vbGliL2VjcycpO1xuXG5jb25zdCAkID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvci5iaW5kKGRvY3VtZW50KTtcblxuKGZ1bmN0aW9uIHRlc3RIZXhhZ29uICgpIHtcbiAgY29uc3Qgb2RkR3JpZCA9IHt3aWR0aDogMTUsIGhlaWdodDoxMywgcmFkaXVzOiAzMn07XG4gIGNvbnN0IGV2ZW5HcmlkID0ge3dpZHRoOiAxNSwgaGVpZ2h0OjEyLCByYWRpdXM6IDMyfTtcbiAgUVVuaXQudGVzdChcIlRlc3QgYWxsQ29vcmRzXCIsIGFzc2VydCA9PiB7XG4gICAgY29uc3QgY29vcmRzQ29ycmVjdCA9IGdyaWQgPT4gQXJyYXkuZnJvbShoZXhhZ29uLmdyaWQuYWxsQ29vcmRzKGdyaWQud2lkdGgsIGdyaWQuaGVpZ2h0KSkuZXZlcnkoY29vcmQgPT4gYXNzZXJ0Lm9rKGhleGFnb24uZ3JpZC5jb250YWlucyhncmlkLndpZHRoLCBncmlkLmhlaWdodCwgY29vcmQueCwgY29vcmQueSksIFwiUGFzc2VkICFcIikpO1xuICAgIGNvbnN0IHJpZ2h0TnVtYmVyQ29vcmRzID0gZ3JpZCA9PiBhc3NlcnQuc3RyaWN0RXF1YWwoQXJyYXkuZnJvbShoZXhhZ29uLmdyaWQuYWxsQ29vcmRzKGdyaWQud2lkdGgsIGdyaWQuaGVpZ2h0KSkubGVuZ3RoLCBoZXhhZ29uLmdyaWQuY2VsbHNOdW1iZXIoZ3JpZC53aWR0aCwgZ3JpZC5oZWlnaHQpLCBcIlBhc3NlZCAhXCIpO1xuICAgIGNvb3Jkc0NvcnJlY3Qob2RkR3JpZCk7XG4gICAgY29vcmRzQ29ycmVjdChldmVuR3JpZCk7XG4gICAgcmlnaHROdW1iZXJDb29yZHMob2RkR3JpZCk7XG4gICAgcmlnaHROdW1iZXJDb29yZHMoZXZlbkdyaWQpO1xuICB9KTtcbn0pKCk7XG4oZnVuY3Rpb24gdGVzdEVDUyAoKSB7XG4gIGNvbnN0IHtQb3NpdGlvbiwgTW92ZW1lbnQsIERyYXdhYmxlfSA9IEVDUy5jcmVhdGVGYWNldFR5cGVzKHtcbiAgICBQb3NpdGlvbjoge3g6IDAsIHk6IDB9LFxuICAgIE1vdmVtZW50OiB7eDogMCwgeTogMH0sXG4gICAgRHJhd2FibGU6IHtjb2xvcjogJ3JiZygwLCAyNTUsIDApJ31cbiAgfSk7XG4gIGNvbnN0IHN1Y2Nlc3NpdmVQb3NpdGlvbnMgPSBbXTtcbiAgY29uc3QgTW92ZW1lbnRQcm9jZXNzb3IgPSB7XG4gICAgbmVlZHM6IFtQb3NpdGlvbiwgTW92ZW1lbnRdLFxuICAgIHVwZGF0ZSAoZmFjZXRzLCBlLCBkZWx0YSkge1xuICAgICAgY29uc3QgcG9zID0gZmFjZXRzLmdldChlLCBQb3NpdGlvbik7XG4gICAgICBjb25zdCBtb3YgPSBmYWNldHMuZ2V0KGUsIE1vdmVtZW50KTtcbiAgICAgIHN1Y2Nlc3NpdmVQb3NpdGlvbnMucHVzaChwb3MpO1xuICAgICAgZmFjZXRzLnNldChlLCBQb3NpdGlvbiwge3g6IHBvcy54ICsgbW92LnggKiBkZWx0YSwgeTogcG9zLnkgKyBtb3YueSAqIGRlbHRhfSk7XG4gICAgfVxuICB9O1xuICBjb25zdCB3b3JsZCA9IEVDUy5jcmVhdGVXb3JsZChbTW92ZW1lbnRQcm9jZXNzb3JdLCBbXG4gICAgW1xuICAgICAgUG9zaXRpb24sIHt4OiAwLCB5OiAwfSxcbiAgICAgIE1vdmVtZW50LCB7eDogMSwgeTogMH1cbiAgICBdXG4gIF0pO1xuICB3b3JsZC5zdGVwKDEpO1xuICB3b3JsZC5zdGVwKDEpO1xuICB3b3JsZC5zdGVwKDEpO1xuICBRVW5pdC50ZXN0KFwiVGVzdCBFQ1NcIiwgYXNzZXJ0ID0+IHtcbiAgICBhc3NlcnQuZGVlcEVxdWFsKHN1Y2Nlc3NpdmVQb3NpdGlvbnMsIFt7eDogMCwgeTogMH0sIHt4OiAxLCB5OiAwfSwge3g6IDIsIHk6IDB9XSk7XG4gIH0pO1xufSkoKTtcbiJdfQ==
