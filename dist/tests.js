(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

function createEntityContainer () {
  const entities = []; // TODO: Implement an efficient storage for facets.
  const entitiesFacetsMask = [];
  const entityRecycleBin = [];
  let lastEntityId = 0;
  return {
    create (facets) { // If an entity was removed, its ID is reused in priority.
      const entityId = entityRecycleBin.length === 0 ? lastEntityId++ : entityRecycleBin.pop();
      entities[entityId] = [];
      entitiesFacetsMask[entityId] = 0;
      for (let i = 0; i < facets.length; i += 2) { // facets contains facetTypes and values
        this.addFacet(entityId, facets[i], facets[i + 1]);
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
    addFacet(e, facetType, facet) {
      entitiesFacetsMask[e] |= 1 << facetType;
      entities[e][facetType] = facet;
    },
    removeFacet(e, facetType) {
      entitiesFacetsMask[e] &= ~(1 << facetType);
      delete entities[e][facetType];
    },
    getFacet (e, facetType) {
      return entities[e][facetType];
    }
  }
}

function createFacetTypes (initialStates) { // FacetTypes are Ids corresponding to an aspect of an entity.
  if (Object.keys(initialStates).length === 32) { throw "The number of facet types is limited to 32."; }
  const types = {};
  Object.keys(initialStates).forEach((type, index) => types[type] = index);
  return types;
}

const requiredProcessorOperations = ['load', 'drop', 'prepare', 'update'];

function createProcessor (entities, definition) {
  requiredProcessorOperations.forEach(op => definition[op] = definition[op] || (_=>_));
  const facetsAccessors = { // These functions are used in the processor definition to retrieve Facets.
    get (entity, type) { return entities.getFacet(entity, type); },
    set (entity, type, facet) { entities.addFacet(entity, type, facet); }
  };
  return { // needsMask is a bitset containing 1 in places corresponding to FacetTypes the processor needs.
    needsMask: (definition.needs || []).reduce((needsMask, elt) => needsMask |= 1 << elt, 0),
    load: definition.load,
    drop: definition.drop,
    prepare: definition.prepare,
    update (e, delta) { definition.update(facetsAccessors, e, delta); }
  };
}

function createStage (processorsProperties, entitiesFacets) {
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

module.exports = {createFacetTypes, createStage};

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

},{"./lib/ecs":1,"./lib/hexagon":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvZWNzLmpzIiwibGliL2hleGFnb24uanMiLCJ0ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBjcmVhdGVFbnRpdHlDb250YWluZXIgKCkge1xuICBjb25zdCBlbnRpdGllcyA9IFtdOyAvLyBUT0RPOiBJbXBsZW1lbnQgYW4gZWZmaWNpZW50IHN0b3JhZ2UgZm9yIGZhY2V0cy5cbiAgY29uc3QgZW50aXRpZXNGYWNldHNNYXNrID0gW107XG4gIGNvbnN0IGVudGl0eVJlY3ljbGVCaW4gPSBbXTtcbiAgbGV0IGxhc3RFbnRpdHlJZCA9IDA7XG4gIHJldHVybiB7XG4gICAgY3JlYXRlIChmYWNldHMpIHsgLy8gSWYgYW4gZW50aXR5IHdhcyByZW1vdmVkLCBpdHMgSUQgaXMgcmV1c2VkIGluIHByaW9yaXR5LlxuICAgICAgY29uc3QgZW50aXR5SWQgPSBlbnRpdHlSZWN5Y2xlQmluLmxlbmd0aCA9PT0gMCA/IGxhc3RFbnRpdHlJZCsrIDogZW50aXR5UmVjeWNsZUJpbi5wb3AoKTtcbiAgICAgIGVudGl0aWVzW2VudGl0eUlkXSA9IFtdO1xuICAgICAgZW50aXRpZXNGYWNldHNNYXNrW2VudGl0eUlkXSA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY2V0cy5sZW5ndGg7IGkgKz0gMikgeyAvLyBmYWNldHMgY29udGFpbnMgZmFjZXRUeXBlcyBhbmQgdmFsdWVzXG4gICAgICAgIHRoaXMuYWRkRmFjZXQoZW50aXR5SWQsIGZhY2V0c1tpXSwgZmFjZXRzW2kgKyAxXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW50aXR5SWQ7XG4gICAgfSxcbiAgICByZW1vdmUgKGUpIHtcbiAgICAgIGVudGl0aWVzW2VdID0gdW5kZWZpbmVkO1xuICAgICAgZW50aXR5UmVjeWNsZUJpbi5wdXNoKGUpO1xuICAgIH0sXG4gICAgKnByb2Nlc3NhYmxlQnkgKHByb2Nlc3Nvcikge1xuICAgICAgZm9yIChsZXQgZW50aXR5ID0gMDsgZW50aXR5IDwgZW50aXRpZXMubGVuZ3RoOyBlbnRpdHkrKykge1xuICAgICAgICBpZiAoZW50aXRpZXNbZW50aXR5XSAhPT0gdW5kZWZpbmVkICYmICgocHJvY2Vzc29yLm5lZWRzTWFzayAmIH5lbnRpdGllc0ZhY2V0c01hc2tbZW50aXR5XSkgPT09IDApKSB7XG4gICAgICAgICAgeWllbGQgZW50aXR5O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBhZGRGYWNldChlLCBmYWNldFR5cGUsIGZhY2V0KSB7XG4gICAgICBlbnRpdGllc0ZhY2V0c01hc2tbZV0gfD0gMSA8PCBmYWNldFR5cGU7XG4gICAgICBlbnRpdGllc1tlXVtmYWNldFR5cGVdID0gZmFjZXQ7XG4gICAgfSxcbiAgICByZW1vdmVGYWNldChlLCBmYWNldFR5cGUpIHtcbiAgICAgIGVudGl0aWVzRmFjZXRzTWFza1tlXSAmPSB+KDEgPDwgZmFjZXRUeXBlKTtcbiAgICAgIGRlbGV0ZSBlbnRpdGllc1tlXVtmYWNldFR5cGVdO1xuICAgIH0sXG4gICAgZ2V0RmFjZXQgKGUsIGZhY2V0VHlwZSkge1xuICAgICAgcmV0dXJuIGVudGl0aWVzW2VdW2ZhY2V0VHlwZV07XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZhY2V0VHlwZXMgKGluaXRpYWxTdGF0ZXMpIHsgLy8gRmFjZXRUeXBlcyBhcmUgSWRzIGNvcnJlc3BvbmRpbmcgdG8gYW4gYXNwZWN0IG9mIGFuIGVudGl0eS5cbiAgaWYgKE9iamVjdC5rZXlzKGluaXRpYWxTdGF0ZXMpLmxlbmd0aCA9PT0gMzIpIHsgdGhyb3cgXCJUaGUgbnVtYmVyIG9mIGZhY2V0IHR5cGVzIGlzIGxpbWl0ZWQgdG8gMzIuXCI7IH1cbiAgY29uc3QgdHlwZXMgPSB7fTtcbiAgT2JqZWN0LmtleXMoaW5pdGlhbFN0YXRlcykuZm9yRWFjaCgodHlwZSwgaW5kZXgpID0+IHR5cGVzW3R5cGVdID0gaW5kZXgpO1xuICByZXR1cm4gdHlwZXM7XG59XG5cbmNvbnN0IHJlcXVpcmVkUHJvY2Vzc29yT3BlcmF0aW9ucyA9IFsnbG9hZCcsICdkcm9wJywgJ3ByZXBhcmUnLCAndXBkYXRlJ107XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2Nlc3NvciAoZW50aXRpZXMsIGRlZmluaXRpb24pIHtcbiAgcmVxdWlyZWRQcm9jZXNzb3JPcGVyYXRpb25zLmZvckVhY2gob3AgPT4gZGVmaW5pdGlvbltvcF0gPSBkZWZpbml0aW9uW29wXSB8fCAoXz0+XykpO1xuICBjb25zdCBmYWNldHNBY2Nlc3NvcnMgPSB7IC8vIFRoZXNlIGZ1bmN0aW9ucyBhcmUgdXNlZCBpbiB0aGUgcHJvY2Vzc29yIGRlZmluaXRpb24gdG8gcmV0cmlldmUgRmFjZXRzLlxuICAgIGdldCAoZW50aXR5LCB0eXBlKSB7IHJldHVybiBlbnRpdGllcy5nZXRGYWNldChlbnRpdHksIHR5cGUpOyB9LFxuICAgIHNldCAoZW50aXR5LCB0eXBlLCBmYWNldCkgeyBlbnRpdGllcy5hZGRGYWNldChlbnRpdHksIHR5cGUsIGZhY2V0KTsgfVxuICB9O1xuICByZXR1cm4geyAvLyBuZWVkc01hc2sgaXMgYSBiaXRzZXQgY29udGFpbmluZyAxIGluIHBsYWNlcyBjb3JyZXNwb25kaW5nIHRvIEZhY2V0VHlwZXMgdGhlIHByb2Nlc3NvciBuZWVkcy5cbiAgICBuZWVkc01hc2s6IChkZWZpbml0aW9uLm5lZWRzIHx8IFtdKS5yZWR1Y2UoKG5lZWRzTWFzaywgZWx0KSA9PiBuZWVkc01hc2sgfD0gMSA8PCBlbHQsIDApLFxuICAgIGxvYWQ6IGRlZmluaXRpb24ubG9hZCxcbiAgICBkcm9wOiBkZWZpbml0aW9uLmRyb3AsXG4gICAgcHJlcGFyZTogZGVmaW5pdGlvbi5wcmVwYXJlLFxuICAgIHVwZGF0ZSAoZSwgZGVsdGEpIHsgZGVmaW5pdGlvbi51cGRhdGUoZmFjZXRzQWNjZXNzb3JzLCBlLCBkZWx0YSk7IH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU3RhZ2UgKHByb2Nlc3NvcnNQcm9wZXJ0aWVzLCBlbnRpdGllc0ZhY2V0cykge1xuICBjb25zdCBlbnRpdGllcyA9IGNyZWF0ZUVudGl0eUNvbnRhaW5lcigpO1xuICBjb25zdCBwcm9jZXNzb3JzID0gcHJvY2Vzc29yc1Byb3BlcnRpZXMubWFwKHByb2Nlc3NvclByb3BlcnRpZXMgPT4gY3JlYXRlUHJvY2Vzc29yKGVudGl0aWVzLCBwcm9jZXNzb3JQcm9wZXJ0aWVzKSk7XG4gIGVudGl0aWVzRmFjZXRzLmZvckVhY2goZW50aXR5RmFjZXRzID0+IGVudGl0aWVzLmNyZWF0ZShlbnRpdHlGYWNldHMpKTtcbiAgcmV0dXJuIHtcbiAgICBsb2FkICgpIHtcbiAgICAgIHByb2Nlc3NvcnMuZm9yRWFjaChwcm9jZXNzb3IgPT4gcHJvY2Vzc29yLmxvYWQoKSk7XG4gICAgfSxcbiAgICBkcm9wICgpIHtcbiAgICAgIHByb2Nlc3NvcnMuZm9yRWFjaChwcm9jZXNzb3IgPT4gcHJvY2Vzc29yLmRyb3AoKSk7XG4gICAgfSxcbiAgICBzdGVwIChkZWx0YSkge1xuICAgICAgZm9yIChsZXQgcHJvY2Vzc29yIG9mIHByb2Nlc3NvcnMpIHtcbiAgICAgICAgcHJvY2Vzc29yLnByZXBhcmUoZGVsdGEpO1xuICAgICAgICBmb3IgKGxldCBlbnRpdHkgb2YgZW50aXRpZXMucHJvY2Vzc2FibGVCeShwcm9jZXNzb3IpKSB7XG4gICAgICAgICAgcHJvY2Vzc29yLnVwZGF0ZShlbnRpdHksIGRlbHRhKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtjcmVhdGVGYWNldFR5cGVzLCBjcmVhdGVTdGFnZX07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuY29uc3QgU1FSVDMgPSBNYXRoLnNxcnQoMyk7XG5cbmNvbnN0IGhleGFnb24gPSB7XG4gIGFyZWEocmFkaXVzKSB7XG4gICAgcmV0dXJuIDEuNSAqIFNRUlQzICogcmFkaXVzICogcmFkaXVzO1xuICB9LFxuICBjb3JuZXJzKGNlbnRlciwgcmFkaXVzKSB7XG4gICAgY29uc3QgSF9PRkZTRVQgPSBTUVJUMyAqIDAuNSAqIHJhZGl1cztcbiAgICBjb25zdCBWX09GRlNFVCA9IHJhZGl1cyAqIDAuNTtcbiAgICByZXR1cm4gW1xuICAgICAge3g6IGNlbnRlci54IC0gSF9PRkZTRVQsIHk6IGNlbnRlci55IC0gVl9PRkZTRVR9LFxuICAgICAge3g6IGNlbnRlci54LCB5OiBjZW50ZXIueSAtIHJhZGl1c30sXG4gICAgICB7eDogY2VudGVyLnggKyBIX09GRlNFVCwgeTogY2VudGVyLnkgLSBWX09GRlNFVH0sXG4gICAgICB7eDogY2VudGVyLnggKyBIX09GRlNFVCwgeTogY2VudGVyLnkgKyBWX09GRlNFVH0sXG4gICAgICB7eDogY2VudGVyLngsIHk6IGNlbnRlci55ICsgcmFkaXVzfSxcbiAgICAgIHt4OiBjZW50ZXIueCAtIEhfT0ZGU0VULCB5OiBjZW50ZXIueSArIFZfT0ZGU0VUfVxuICAgIF07XG4gIH0sXG4gIHBhdGgoY3R4LCBjZW50ZXIsIHJhZGl1cykge1xuICAgIGNvbnN0IENPUk5FUlMgPSBoZXhhZ29uLmNvcm5lcnMoY2VudGVyLCByYWRpdXMpO1xuICAgIGN0eC5tb3ZlVG8oQ09STkVSU1s1XS54LCBDT1JORVJTWzVdLnkpO1xuICAgIGZvciAodmFyIGNvcm5lciBvZiBDT1JORVJTKSB7XG4gICAgICBjdHgubGluZVRvKGNvcm5lci54LCBjb3JuZXIueSk7XG4gICAgfVxuICB9XG59XG5cbmhleGFnb24uZ3JpZCA9IHtcbiAgcGl4ZWxXaWR0aCh3aWR0aCwgcmFkaXVzKSB7XG4gICAgcmV0dXJuIFNRUlQzICogd2lkdGggKiByYWRpdXM7XG4gIH0sXG4gIHBpeGVsSGVpZ2h0KGhlaWdodCwgcmFkaXVzKSB7XG4gICAgcmV0dXJuICgxLjUgKiBoZWlnaHQgKyAwLjUpICogcmFkaXVzO1xuICB9LFxuICBwaXhlbFRvQXhpcyh4LCB5LCByYWRpdXMpIHtcbiAgICBjb25zdCBXSURUSF9OVU0gPSBNYXRoLmZsb29yKHggLyAoU1FSVDMgKiAwLjUgKiByYWRpdXMpKTtcbiAgICBjb25zdCBIRUlHSFRfTlVNID0gTWF0aC5mbG9vcih5IC8gKDAuNSAqIHJhZGl1cykpO1xuICAgIGNvbnN0IEhFWF9ZID0gTWF0aC5mbG9vcihIRUlHSFRfTlVNIC8gMyk7XG4gICAgY29uc3QgSEVYX1ggPSBNYXRoLmZsb29yKDAuNSAqIChXSURUSF9OVU0gLSBIRVhfWSkpO1xuICAgIHJldHVybiB7eDogSEVYX1gsIHk6IEhFWF9ZfTtcbiAgfSxcbiAgYXhpc1RvUGl4ZWwoeCwgeSwgcmFkaXVzKSB7XG4gICAgY29uc3QgUElYX1kgPSByYWRpdXMgKyAxLjUgKiByYWRpdXMgKiB5O1xuICAgIGNvbnN0IFBJWF9YID0gKFBJWF9ZIC0gcmFkaXVzKSAvIFNRUlQzICsgU1FSVDMgKiByYWRpdXMgKiAoeCArIDAuNSk7XG4gICAgcmV0dXJuIHt4OiBQSVhfWCwgeTogUElYX1l9O1xuICB9LFxuICBjb250YWlucyh3aWR0aCwgaGVpZ2h0LCB4LCB5KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoeCArIDAuNSAqIHkpID49IDAgJiYgTWF0aC5jZWlsKHggKyAwLjUgKiB5KSA8IHdpZHRoICYmIHkgPj0gMCAmJiB5IDwgaGVpZ2h0O1xuICB9LFxuICBjZWxsc051bWJlcih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgcmV0dXJuIE1hdGguY2VpbCgwLjUgKiBoZWlnaHQpICogd2lkdGggKyBNYXRoLmZsb29yKDAuNSAqIGhlaWdodCkgKiAod2lkdGggLSAxKTtcbiAgfSxcbiAgYWxsQ29vcmRzKHdpZHRoLCBoZWlnaHQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgKltTeW1ib2wuaXRlcmF0b3JdKCkge1xuICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG4gICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCB3aWR0aCAtIDE7IHgrKykge1xuICAgICAgICAgICAgeWllbGQge3g6IE1hdGguY2VpbCh4IC0gMC41ICogeSksIHk6IHl9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoeSAlIDIgPT09IDApIHsgeWllbGQge3g6IE1hdGguZmxvb3IoeCAtIDAuNSAqIHkpLCB5fTsgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBkcmF3KGN0eCwgZ3JpZCwgc3R5bGUpIHtcbiAgICBjb25zdCBIRVhfV0lEVEggPSBTUVJUMyAqIGdyaWQucmFkaXVzO1xuICAgIGNvbnN0IEhFWF9IRUlHSFQgPSAyICogZ3JpZC5yYWRpdXM7XG4gICAgY29uc3QgTEFTVF9ZID0gKDEuNSAqIGdyaWQuaGVpZ2h0ICsgMSkgKiBncmlkLnJhZGl1cztcbiAgICB2YXIgeCA9IDA7XG4gICAgY3R4LnN0cm9rZVN0eWxlID0gc3R5bGU7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGZvciAodmFyIHkgPSAwLjUgKiBncmlkLnJhZGl1czsgeSA8IExBU1RfWTsgeSArPSAxLjUgKiBIRVhfSEVJR0hUKSB7XG4gICAgICBmb3IgKHggPSAwOyB4IDwgSEVYX1dJRFRIICogZ3JpZC53aWR0aDsgeCArPSBIRVhfV0lEVEgpIHtcbiAgICAgICAgY3R4Lm1vdmVUbyh4LCB5ICsgZ3JpZC5yYWRpdXMpO1xuICAgICAgICBjdHgubGluZVRvKHgsIHkpO1xuICAgICAgICBjdHgubGluZVRvKHggKyAwLjUgKiBIRVhfV0lEVEgsIHkgLSAwLjUgKiBncmlkLnJhZGl1cyk7XG4gICAgICAgIGN0eC5saW5lVG8oeCArIEhFWF9XSURUSCwgeSk7XG4gICAgICAgIGN0eC5tb3ZlVG8oeCwgeSArIGdyaWQucmFkaXVzKTtcbiAgICAgICAgY3R4LmxpbmVUbyh4ICsgMC41ICogSEVYX1dJRFRILCB5ICsgMS41ICogZ3JpZC5yYWRpdXMpO1xuICAgICAgICBpZiAoeSA8IExBU1RfWSAtIDEuNSAqIEhFWF9IRUlHSFQpIHtcbiAgICAgICAgICBjdHgubGluZVRvKHggKyAwLjUgKiBIRVhfV0lEVEgsIHkgKyAyLjUgKiBncmlkLnJhZGl1cyk7XG4gICAgICAgICAgY3R4Lm1vdmVUbyh4ICsgMC41ICogSEVYX1dJRFRILCB5ICsgMS41ICogZ3JpZC5yYWRpdXMpO1xuICAgICAgICB9XG4gICAgICAgIGN0eC5saW5lVG8oeCArIEhFWF9XSURUSCwgeSArIGdyaWQucmFkaXVzKTtcbiAgICAgIH1cbiAgICAgIGN0eC5saW5lVG8oeCwgeSk7XG4gICAgfVxuICAgIGN0eC5zdHJva2UoKTtcbiAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gaGV4YWdvbjtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBoZXhhZ29uID0gcmVxdWlyZSgnLi9saWIvaGV4YWdvbicpO1xuY29uc3QgRUNTID0gcmVxdWlyZSgnLi9saWIvZWNzJyk7XG5cbmNvbnN0ICQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yLmJpbmQoZG9jdW1lbnQpO1xuXG4oZnVuY3Rpb24gdGVzdEhleGFnb24gKCkge1xuICBjb25zdCBvZGRHcmlkID0ge3dpZHRoOiAxNSwgaGVpZ2h0OjEzLCByYWRpdXM6IDMyfTtcbiAgY29uc3QgZXZlbkdyaWQgPSB7d2lkdGg6IDE1LCBoZWlnaHQ6MTIsIHJhZGl1czogMzJ9O1xuICBRVW5pdC50ZXN0KFwiVGVzdCBhbGxDb29yZHNcIiwgYXNzZXJ0ID0+IHtcbiAgICBjb25zdCBjb29yZHNDb3JyZWN0ID0gZ3JpZCA9PiBBcnJheS5mcm9tKGhleGFnb24uZ3JpZC5hbGxDb29yZHMoZ3JpZC53aWR0aCwgZ3JpZC5oZWlnaHQpKS5ldmVyeShjb29yZCA9PiBhc3NlcnQub2soaGV4YWdvbi5ncmlkLmNvbnRhaW5zKGdyaWQud2lkdGgsIGdyaWQuaGVpZ2h0LCBjb29yZC54LCBjb29yZC55KSwgXCJQYXNzZWQgIVwiKSk7XG4gICAgY29uc3QgcmlnaHROdW1iZXJDb29yZHMgPSBncmlkID0+IGFzc2VydC5zdHJpY3RFcXVhbChBcnJheS5mcm9tKGhleGFnb24uZ3JpZC5hbGxDb29yZHMoZ3JpZC53aWR0aCwgZ3JpZC5oZWlnaHQpKS5sZW5ndGgsIGhleGFnb24uZ3JpZC5jZWxsc051bWJlcihncmlkLndpZHRoLCBncmlkLmhlaWdodCksIFwiUGFzc2VkICFcIik7XG4gICAgY29vcmRzQ29ycmVjdChvZGRHcmlkKTtcbiAgICBjb29yZHNDb3JyZWN0KGV2ZW5HcmlkKTtcbiAgICByaWdodE51bWJlckNvb3JkcyhvZGRHcmlkKTtcbiAgICByaWdodE51bWJlckNvb3JkcyhldmVuR3JpZCk7XG4gIH0pO1xufSkoKTtcbihmdW5jdGlvbiB0ZXN0RUNTICgpIHtcbiAgY29uc3Qge1Bvc2l0aW9uLCBNb3ZlbWVudCwgRHJhd2FibGV9ID0gRUNTLmNyZWF0ZUZhY2V0VHlwZXMoe1xuICAgIFBvc2l0aW9uOiB7eDogMCwgeTogMH0sXG4gICAgTW92ZW1lbnQ6IHt4OiAwLCB5OiAwfSxcbiAgICBEcmF3YWJsZToge2NvbG9yOiAncmJnKDAsIDI1NSwgMCknfVxuICB9KTtcbiAgY29uc3Qgc3VjY2Vzc2l2ZVBvc2l0aW9ucyA9IFtdO1xuICBjb25zdCBNb3ZlbWVudFByb2Nlc3NvciA9IHtcbiAgICBuZWVkczogW1Bvc2l0aW9uLCBNb3ZlbWVudF0sXG4gICAgdXBkYXRlIChmYWNldHMsIGUsIGRlbHRhKSB7XG4gICAgICBjb25zdCBwb3MgPSBmYWNldHMuZ2V0KGUsIFBvc2l0aW9uKTtcbiAgICAgIGNvbnN0IG1vdiA9IGZhY2V0cy5nZXQoZSwgTW92ZW1lbnQpO1xuICAgICAgc3VjY2Vzc2l2ZVBvc2l0aW9ucy5wdXNoKHBvcyk7XG4gICAgICBmYWNldHMuc2V0KGUsIFBvc2l0aW9uLCB7eDogcG9zLnggKyBtb3YueCAqIGRlbHRhLCB5OiBwb3MueSArIG1vdi55ICogZGVsdGF9KTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHN0YWdlID0gRUNTLmNyZWF0ZVN0YWdlKFtNb3ZlbWVudFByb2Nlc3Nvcl0sIFtcbiAgICBbXG4gICAgICBQb3NpdGlvbiwge3g6IDAsIHk6IDB9LFxuICAgICAgTW92ZW1lbnQsIHt4OiAxLCB5OiAwfVxuICAgIF1cbiAgXSk7XG4gIHN0YWdlLnN0ZXAoMSk7XG4gIHN0YWdlLnN0ZXAoMSk7XG4gIHN0YWdlLnN0ZXAoMSk7XG4gIFFVbml0LnRlc3QoXCJUZXN0IEVDU1wiLCBhc3NlcnQgPT4ge1xuICAgIGFzc2VydC5kZWVwRXF1YWwoc3VjY2Vzc2l2ZVBvc2l0aW9ucywgW3t4OiAwLCB5OiAwfSwge3g6IDEsIHk6IDB9LCB7eDogMiwgeTogMH1dKTtcbiAgfSk7XG59KSgpO1xuIl19
