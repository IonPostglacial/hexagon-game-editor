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
    needsMask: [0, ...(definition.needs || [])].reduce((needsMask, elt) => needsMask |= 1 << elt),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvZWNzLmpzIiwibGliL2hleGFnb24uanMiLCJ0ZXN0cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlwidXNlIHN0cmljdFwiO1xuXG5mdW5jdGlvbiBjcmVhdGVFbnRpdHlDb250YWluZXIgKCkge1xuICBjb25zdCBlbnRpdGllcyA9IFtdOyAvLyBUT0RPOiBJbXBsZW1lbnQgYW4gZWZmaWNpZW50IHN0b3JhZ2UgZm9yIGZhY2V0cy5cbiAgY29uc3QgZW50aXRpZXNGYWNldHNNYXNrID0gW107XG4gIGNvbnN0IGVudGl0eVJlY3ljbGVCaW4gPSBbXTtcbiAgbGV0IGxhc3RFbnRpdHlJZCA9IDA7XG4gIHJldHVybiB7XG4gICAgY3JlYXRlIChmYWNldHMpIHsgLy8gSWYgYW4gZW50aXR5IHdhcyByZW1vdmVkLCBpdHMgSUQgaXMgcmV1c2VkIGluIHByaW9yaXR5LlxuICAgICAgY29uc3QgZW50aXR5SWQgPSBlbnRpdHlSZWN5Y2xlQmluLmxlbmd0aCA9PT0gMCA/IGxhc3RFbnRpdHlJZCsrIDogZW50aXR5UmVjeWNsZUJpbi5wb3AoKTtcbiAgICAgIGVudGl0aWVzW2VudGl0eUlkXSA9IFtdO1xuICAgICAgZW50aXRpZXNGYWNldHNNYXNrW2VudGl0eUlkXSA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY2V0cy5sZW5ndGg7IGkgKz0gMikgeyAvLyBmYWNldHMgY29udGFpbnMgZmFjZXRUeXBlcyBhbmQgdmFsdWVzXG4gICAgICAgIHRoaXMuYWRkRmFjZXQoZW50aXR5SWQsIGZhY2V0c1tpXSwgZmFjZXRzW2kgKyAxXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW50aXR5SWQ7XG4gICAgfSxcbiAgICByZW1vdmUgKGUpIHtcbiAgICAgIGVudGl0aWVzW2VdID0gdW5kZWZpbmVkO1xuICAgICAgZW50aXR5UmVjeWNsZUJpbi5wdXNoKGUpO1xuICAgIH0sXG4gICAgKnByb2Nlc3NhYmxlQnkgKHByb2Nlc3Nvcikge1xuICAgICAgZm9yIChsZXQgZW50aXR5ID0gMDsgZW50aXR5IDwgZW50aXRpZXMubGVuZ3RoOyBlbnRpdHkrKykge1xuICAgICAgICBpZiAoZW50aXRpZXNbZW50aXR5XSAhPT0gdW5kZWZpbmVkICYmICgocHJvY2Vzc29yLm5lZWRzTWFzayAmIH5lbnRpdGllc0ZhY2V0c01hc2tbZW50aXR5XSkgPT09IDApKSB7XG4gICAgICAgICAgeWllbGQgZW50aXR5O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBhZGRGYWNldChlLCBmYWNldFR5cGUsIGZhY2V0KSB7XG4gICAgICBlbnRpdGllc0ZhY2V0c01hc2tbZV0gfD0gMSA8PCBmYWNldFR5cGU7XG4gICAgICBlbnRpdGllc1tlXVtmYWNldFR5cGVdID0gZmFjZXQ7XG4gICAgfSxcbiAgICByZW1vdmVGYWNldChlLCBmYWNldFR5cGUpIHtcbiAgICAgIGVudGl0aWVzRmFjZXRzTWFza1tlXSAmPSB+KDEgPDwgZmFjZXRUeXBlKTtcbiAgICAgIGRlbGV0ZSBlbnRpdGllc1tlXVtmYWNldFR5cGVdO1xuICAgIH0sXG4gICAgZ2V0RmFjZXQgKGUsIGZhY2V0VHlwZSkge1xuICAgICAgcmV0dXJuIGVudGl0aWVzW2VdW2ZhY2V0VHlwZV07XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZhY2V0VHlwZXMgKGluaXRpYWxTdGF0ZXMpIHsgLy8gRmFjZXRUeXBlcyBhcmUgSWRzIGNvcnJlc3BvbmRpbmcgdG8gYW4gYXNwZWN0IG9mIGFuIGVudGl0eS5cbiAgaWYgKE9iamVjdC5rZXlzKGluaXRpYWxTdGF0ZXMpLmxlbmd0aCA9PT0gMzIpIHsgdGhyb3cgXCJUaGUgbnVtYmVyIG9mIGZhY2V0IHR5cGVzIGlzIGxpbWl0ZWQgdG8gMzIuXCI7IH1cbiAgY29uc3QgdHlwZXMgPSB7fTtcbiAgT2JqZWN0LmtleXMoaW5pdGlhbFN0YXRlcykuZm9yRWFjaCgodHlwZSwgaW5kZXgpID0+IHR5cGVzW3R5cGVdID0gaW5kZXgpO1xuICByZXR1cm4gdHlwZXM7XG59XG5cbmNvbnN0IHJlcXVpcmVkUHJvY2Vzc29yT3BlcmF0aW9ucyA9IFsnbG9hZCcsICdkcm9wJywgJ3ByZXBhcmUnLCAndXBkYXRlJ107XG5cbmZ1bmN0aW9uIGNyZWF0ZVByb2Nlc3NvciAoZW50aXRpZXMsIGRlZmluaXRpb24pIHtcbiAgcmVxdWlyZWRQcm9jZXNzb3JPcGVyYXRpb25zLmZvckVhY2gob3AgPT4gZGVmaW5pdGlvbltvcF0gPSBkZWZpbml0aW9uW29wXSB8fCAoXz0+XykpO1xuICBjb25zdCBmYWNldHNBY2Nlc3NvcnMgPSB7IC8vIFRoZXNlIGZ1bmN0aW9ucyBhcmUgdXNlZCBpbiB0aGUgcHJvY2Vzc29yIGRlZmluaXRpb24gdG8gcmV0cmlldmUgRmFjZXRzLlxuICAgIGdldCAoZW50aXR5LCB0eXBlKSB7IHJldHVybiBlbnRpdGllcy5nZXRGYWNldChlbnRpdHksIHR5cGUpOyB9LFxuICAgIHNldCAoZW50aXR5LCB0eXBlLCBmYWNldCkgeyBlbnRpdGllcy5hZGRGYWNldChlbnRpdHksIHR5cGUsIGZhY2V0KTsgfVxuICB9O1xuICByZXR1cm4geyAvLyBuZWVkc01hc2sgaXMgYSBiaXRzZXQgY29udGFpbmluZyAxIGluIHBsYWNlcyBjb3JyZXNwb25kaW5nIHRvIEZhY2V0VHlwZXMgdGhlIHByb2Nlc3NvciBuZWVkcy5cbiAgICBuZWVkc01hc2s6IFswLCAuLi4oZGVmaW5pdGlvbi5uZWVkcyB8fCBbXSldLnJlZHVjZSgobmVlZHNNYXNrLCBlbHQpID0+IG5lZWRzTWFzayB8PSAxIDw8IGVsdCksXG4gICAgbG9hZDogZGVmaW5pdGlvbi5sb2FkLFxuICAgIGRyb3A6IGRlZmluaXRpb24uZHJvcCxcbiAgICBwcmVwYXJlOiBkZWZpbml0aW9uLnByZXBhcmUsXG4gICAgdXBkYXRlIChlLCBkZWx0YSkgeyBkZWZpbml0aW9uLnVwZGF0ZShmYWNldHNBY2Nlc3NvcnMsIGUsIGRlbHRhKTsgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTdGFnZSAocHJvY2Vzc29yc1Byb3BlcnRpZXMsIGVudGl0aWVzRmFjZXRzKSB7XG4gIGNvbnN0IGVudGl0aWVzID0gY3JlYXRlRW50aXR5Q29udGFpbmVyKCk7XG4gIGNvbnN0IHByb2Nlc3NvcnMgPSBwcm9jZXNzb3JzUHJvcGVydGllcy5tYXAocHJvY2Vzc29yUHJvcGVydGllcyA9PiBjcmVhdGVQcm9jZXNzb3IoZW50aXRpZXMsIHByb2Nlc3NvclByb3BlcnRpZXMpKTtcbiAgZW50aXRpZXNGYWNldHMuZm9yRWFjaChlbnRpdHlGYWNldHMgPT4gZW50aXRpZXMuY3JlYXRlKGVudGl0eUZhY2V0cykpO1xuICByZXR1cm4ge1xuICAgIGxvYWQgKCkge1xuICAgICAgcHJvY2Vzc29ycy5mb3JFYWNoKHByb2Nlc3NvciA9PiBwcm9jZXNzb3IubG9hZCgpKTtcbiAgICB9LFxuICAgIGRyb3AgKCkge1xuICAgICAgcHJvY2Vzc29ycy5mb3JFYWNoKHByb2Nlc3NvciA9PiBwcm9jZXNzb3IuZHJvcCgpKTtcbiAgICB9LFxuICAgIHN0ZXAgKGRlbHRhKSB7XG4gICAgICBmb3IgKGxldCBwcm9jZXNzb3Igb2YgcHJvY2Vzc29ycykge1xuICAgICAgICBwcm9jZXNzb3IucHJlcGFyZShkZWx0YSk7XG4gICAgICAgIGZvciAobGV0IGVudGl0eSBvZiBlbnRpdGllcy5wcm9jZXNzYWJsZUJ5KHByb2Nlc3NvcikpIHtcbiAgICAgICAgICBwcm9jZXNzb3IudXBkYXRlKGVudGl0eSwgZGVsdGEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge2NyZWF0ZUZhY2V0VHlwZXMsIGNyZWF0ZVN0YWdlfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBTUVJUMyA9IE1hdGguc3FydCgzKTtcblxuY29uc3QgaGV4YWdvbiA9IHtcbiAgYXJlYShyYWRpdXMpIHtcbiAgICByZXR1cm4gMS41ICogU1FSVDMgKiByYWRpdXMgKiByYWRpdXM7XG4gIH0sXG4gIGNvcm5lcnMoY2VudGVyLCByYWRpdXMpIHtcbiAgICBjb25zdCBIX09GRlNFVCA9IFNRUlQzICogMC41ICogcmFkaXVzO1xuICAgIGNvbnN0IFZfT0ZGU0VUID0gcmFkaXVzICogMC41O1xuICAgIHJldHVybiBbXG4gICAgICB7eDogY2VudGVyLnggLSBIX09GRlNFVCwgeTogY2VudGVyLnkgLSBWX09GRlNFVH0sXG4gICAgICB7eDogY2VudGVyLngsIHk6IGNlbnRlci55IC0gcmFkaXVzfSxcbiAgICAgIHt4OiBjZW50ZXIueCArIEhfT0ZGU0VULCB5OiBjZW50ZXIueSAtIFZfT0ZGU0VUfSxcbiAgICAgIHt4OiBjZW50ZXIueCArIEhfT0ZGU0VULCB5OiBjZW50ZXIueSArIFZfT0ZGU0VUfSxcbiAgICAgIHt4OiBjZW50ZXIueCwgeTogY2VudGVyLnkgKyByYWRpdXN9LFxuICAgICAge3g6IGNlbnRlci54IC0gSF9PRkZTRVQsIHk6IGNlbnRlci55ICsgVl9PRkZTRVR9XG4gICAgXTtcbiAgfSxcbiAgcGF0aChjdHgsIGNlbnRlciwgcmFkaXVzKSB7XG4gICAgY29uc3QgQ09STkVSUyA9IGhleGFnb24uY29ybmVycyhjZW50ZXIsIHJhZGl1cyk7XG4gICAgY3R4Lm1vdmVUbyhDT1JORVJTWzVdLngsIENPUk5FUlNbNV0ueSk7XG4gICAgZm9yICh2YXIgY29ybmVyIG9mIENPUk5FUlMpIHtcbiAgICAgIGN0eC5saW5lVG8oY29ybmVyLngsIGNvcm5lci55KTtcbiAgICB9XG4gIH1cbn1cblxuaGV4YWdvbi5ncmlkID0ge1xuICBwaXhlbFdpZHRoKHdpZHRoLCByYWRpdXMpIHtcbiAgICByZXR1cm4gU1FSVDMgKiB3aWR0aCAqIHJhZGl1cztcbiAgfSxcbiAgcGl4ZWxIZWlnaHQoaGVpZ2h0LCByYWRpdXMpIHtcbiAgICByZXR1cm4gKDEuNSAqIGhlaWdodCArIDAuNSkgKiByYWRpdXM7XG4gIH0sXG4gIHBpeGVsVG9BeGlzKHgsIHksIHJhZGl1cykge1xuICAgIGNvbnN0IFdJRFRIX05VTSA9IE1hdGguZmxvb3IoeCAvIChTUVJUMyAqIDAuNSAqIHJhZGl1cykpO1xuICAgIGNvbnN0IEhFSUdIVF9OVU0gPSBNYXRoLmZsb29yKHkgLyAoMC41ICogcmFkaXVzKSk7XG4gICAgY29uc3QgSEVYX1kgPSBNYXRoLmZsb29yKEhFSUdIVF9OVU0gLyAzKTtcbiAgICBjb25zdCBIRVhfWCA9IE1hdGguZmxvb3IoMC41ICogKFdJRFRIX05VTSAtIEhFWF9ZKSk7XG4gICAgcmV0dXJuIHt4OiBIRVhfWCwgeTogSEVYX1l9O1xuICB9LFxuICBheGlzVG9QaXhlbCh4LCB5LCByYWRpdXMpIHtcbiAgICBjb25zdCBQSVhfWSA9IHJhZGl1cyArIDEuNSAqIHJhZGl1cyAqIHk7XG4gICAgY29uc3QgUElYX1ggPSAoUElYX1kgLSByYWRpdXMpIC8gU1FSVDMgKyBTUVJUMyAqIHJhZGl1cyAqICh4ICsgMC41KTtcbiAgICByZXR1cm4ge3g6IFBJWF9YLCB5OiBQSVhfWX07XG4gIH0sXG4gIGNvbnRhaW5zKHdpZHRoLCBoZWlnaHQsIHgsIHkpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcih4ICsgMC41ICogeSkgPj0gMCAmJiBNYXRoLmNlaWwoeCArIDAuNSAqIHkpIDwgd2lkdGggJiYgeSA+PSAwICYmIHkgPCBoZWlnaHQ7XG4gIH0sXG4gIGNlbGxzTnVtYmVyKHdpZHRoLCBoZWlnaHQpIHtcbiAgICByZXR1cm4gTWF0aC5jZWlsKDAuNSAqIGhlaWdodCkgKiB3aWR0aCArIE1hdGguZmxvb3IoMC41ICogaGVpZ2h0KSAqICh3aWR0aCAtIDEpO1xuICB9LFxuICBhbGxDb29yZHMod2lkdGgsIGhlaWdodCkge1xuICAgIHJldHVybiB7XG4gICAgICAqW1N5bWJvbC5pdGVyYXRvcl0oKSB7XG4gICAgICAgIGZvciAodmFyIHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHdpZHRoIC0gMTsgeCsrKSB7XG4gICAgICAgICAgICB5aWVsZCB7eDogTWF0aC5jZWlsKHggLSAwLjUgKiB5KSwgeTogeX07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh5ICUgMiA9PT0gMCkgeyB5aWVsZCB7eDogTWF0aC5mbG9vcih4IC0gMC41ICogeSksIHl9OyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGRyYXcoY3R4LCBncmlkLCBzdHlsZSkge1xuICAgIGNvbnN0IEhFWF9XSURUSCA9IFNRUlQzICogZ3JpZC5yYWRpdXM7XG4gICAgY29uc3QgSEVYX0hFSUdIVCA9IDIgKiBncmlkLnJhZGl1cztcbiAgICBjb25zdCBMQVNUX1kgPSAoMS41ICogZ3JpZC5oZWlnaHQgKyAxKSAqIGdyaWQucmFkaXVzO1xuICAgIHZhciB4ID0gMDtcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSBzdHlsZTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgZm9yICh2YXIgeSA9IDAuNSAqIGdyaWQucmFkaXVzOyB5IDwgTEFTVF9ZOyB5ICs9IDEuNSAqIEhFWF9IRUlHSFQpIHtcbiAgICAgIGZvciAoeCA9IDA7IHggPCBIRVhfV0lEVEggKiBncmlkLndpZHRoOyB4ICs9IEhFWF9XSURUSCkge1xuICAgICAgICBjdHgubW92ZVRvKHgsIHkgKyBncmlkLnJhZGl1cyk7XG4gICAgICAgIGN0eC5saW5lVG8oeCwgeSk7XG4gICAgICAgIGN0eC5saW5lVG8oeCArIDAuNSAqIEhFWF9XSURUSCwgeSAtIDAuNSAqIGdyaWQucmFkaXVzKTtcbiAgICAgICAgY3R4LmxpbmVUbyh4ICsgSEVYX1dJRFRILCB5KTtcbiAgICAgICAgY3R4Lm1vdmVUbyh4LCB5ICsgZ3JpZC5yYWRpdXMpO1xuICAgICAgICBjdHgubGluZVRvKHggKyAwLjUgKiBIRVhfV0lEVEgsIHkgKyAxLjUgKiBncmlkLnJhZGl1cyk7XG4gICAgICAgIGlmICh5IDwgTEFTVF9ZIC0gMS41ICogSEVYX0hFSUdIVCkge1xuICAgICAgICAgIGN0eC5saW5lVG8oeCArIDAuNSAqIEhFWF9XSURUSCwgeSArIDIuNSAqIGdyaWQucmFkaXVzKTtcbiAgICAgICAgICBjdHgubW92ZVRvKHggKyAwLjUgKiBIRVhfV0lEVEgsIHkgKyAxLjUgKiBncmlkLnJhZGl1cyk7XG4gICAgICAgIH1cbiAgICAgICAgY3R4LmxpbmVUbyh4ICsgSEVYX1dJRFRILCB5ICsgZ3JpZC5yYWRpdXMpO1xuICAgICAgfVxuICAgICAgY3R4LmxpbmVUbyh4LCB5KTtcbiAgICB9XG4gICAgY3R4LnN0cm9rZSgpO1xuICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBoZXhhZ29uO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IGhleGFnb24gPSByZXF1aXJlKCcuL2xpYi9oZXhhZ29uJyk7XG5jb25zdCBFQ1MgPSByZXF1aXJlKCcuL2xpYi9lY3MnKTtcblxuY29uc3QgJCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IuYmluZChkb2N1bWVudCk7XG5cbihmdW5jdGlvbiB0ZXN0SGV4YWdvbiAoKSB7XG4gIGNvbnN0IG9kZEdyaWQgPSB7d2lkdGg6IDE1LCBoZWlnaHQ6MTMsIHJhZGl1czogMzJ9O1xuICBjb25zdCBldmVuR3JpZCA9IHt3aWR0aDogMTUsIGhlaWdodDoxMiwgcmFkaXVzOiAzMn07XG4gIFFVbml0LnRlc3QoXCJUZXN0IGFsbENvb3Jkc1wiLCBhc3NlcnQgPT4ge1xuICAgIGNvbnN0IGNvb3Jkc0NvcnJlY3QgPSBncmlkID0+IEFycmF5LmZyb20oaGV4YWdvbi5ncmlkLmFsbENvb3JkcyhncmlkLndpZHRoLCBncmlkLmhlaWdodCkpLmV2ZXJ5KGNvb3JkID0+IGFzc2VydC5vayhoZXhhZ29uLmdyaWQuY29udGFpbnMoZ3JpZC53aWR0aCwgZ3JpZC5oZWlnaHQsIGNvb3JkLngsIGNvb3JkLnkpLCBcIlBhc3NlZCAhXCIpKTtcbiAgICBjb25zdCByaWdodE51bWJlckNvb3JkcyA9IGdyaWQgPT4gYXNzZXJ0LnN0cmljdEVxdWFsKEFycmF5LmZyb20oaGV4YWdvbi5ncmlkLmFsbENvb3JkcyhncmlkLndpZHRoLCBncmlkLmhlaWdodCkpLmxlbmd0aCwgaGV4YWdvbi5ncmlkLmNlbGxzTnVtYmVyKGdyaWQud2lkdGgsIGdyaWQuaGVpZ2h0KSwgXCJQYXNzZWQgIVwiKTtcbiAgICBjb29yZHNDb3JyZWN0KG9kZEdyaWQpO1xuICAgIGNvb3Jkc0NvcnJlY3QoZXZlbkdyaWQpO1xuICAgIHJpZ2h0TnVtYmVyQ29vcmRzKG9kZEdyaWQpO1xuICAgIHJpZ2h0TnVtYmVyQ29vcmRzKGV2ZW5HcmlkKTtcbiAgfSk7XG59KSgpO1xuKGZ1bmN0aW9uIHRlc3RFQ1MgKCkge1xuICBjb25zdCB7UG9zaXRpb24sIE1vdmVtZW50LCBEcmF3YWJsZX0gPSBFQ1MuY3JlYXRlRmFjZXRUeXBlcyh7XG4gICAgUG9zaXRpb246IHt4OiAwLCB5OiAwfSxcbiAgICBNb3ZlbWVudDoge3g6IDAsIHk6IDB9LFxuICAgIERyYXdhYmxlOiB7Y29sb3I6ICdyYmcoMCwgMjU1LCAwKSd9XG4gIH0pO1xuICBjb25zdCBzdWNjZXNzaXZlUG9zaXRpb25zID0gW107XG4gIGNvbnN0IE1vdmVtZW50UHJvY2Vzc29yID0ge1xuICAgIG5lZWRzOiBbUG9zaXRpb24sIE1vdmVtZW50XSxcbiAgICB1cGRhdGUgKGZhY2V0cywgZSwgZGVsdGEpIHtcbiAgICAgIGNvbnN0IHBvcyA9IGZhY2V0cy5nZXQoZSwgUG9zaXRpb24pO1xuICAgICAgY29uc3QgbW92ID0gZmFjZXRzLmdldChlLCBNb3ZlbWVudCk7XG4gICAgICBzdWNjZXNzaXZlUG9zaXRpb25zLnB1c2gocG9zKTtcbiAgICAgIGZhY2V0cy5zZXQoZSwgUG9zaXRpb24sIHt4OiBwb3MueCArIG1vdi54ICogZGVsdGEsIHk6IHBvcy55ICsgbW92LnkgKiBkZWx0YX0pO1xuICAgIH1cbiAgfTtcbiAgY29uc3Qgc3RhZ2UgPSBFQ1MuY3JlYXRlU3RhZ2UoW01vdmVtZW50UHJvY2Vzc29yXSwgW1xuICAgIFtcbiAgICAgIFBvc2l0aW9uLCB7eDogMCwgeTogMH0sXG4gICAgICBNb3ZlbWVudCwge3g6IDEsIHk6IDB9XG4gICAgXVxuICBdKTtcbiAgc3RhZ2Uuc3RlcCgxKTtcbiAgc3RhZ2Uuc3RlcCgxKTtcbiAgc3RhZ2Uuc3RlcCgxKTtcbiAgUVVuaXQudGVzdChcIlRlc3QgRUNTXCIsIGFzc2VydCA9PiB7XG4gICAgYXNzZXJ0LmRlZXBFcXVhbChzdWNjZXNzaXZlUG9zaXRpb25zLCBbe3g6IDAsIHk6IDB9LCB7eDogMSwgeTogMH0sIHt4OiAyLCB5OiAwfV0pO1xuICB9KTtcbn0pKCk7XG4iXX0=
