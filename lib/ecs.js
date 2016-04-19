define(require => { "use strict";

let initialFacetStates = [];

function createEngine () {
  const entities = []; // TODO: Implement an efficient storage for facets.
  const entitiesFacetsMask = [];
  const entityRecycleBin = [];
  let lastEntityId = 0;
  return {
    createEntity (facets) {
      const entityId = entityRecycleBin.length === 0 ? lastEntityId++ : entityRecycleBin.pop();
      entities[entityId] = [];
      entitiesFacetsMask[entityId] = 0;
      for (let i = 0; i < facets.length; i += 2) {
        this.addFacet(entityId, facets[i], facets[i + 1]);
      }
      return entityId;
    },
    *entitiesConcernedBy (processor) {
      for (let entity = 0; entity < entities.length; entity++) {
        if (entities[entity] !== undefined && ((processor.needsMask & ~entitiesFacetsMask[entity]) === 0)) {
          yield entity;
        }
      }
    },
    removeEntity (e) {
      entities[e] = undefined;
      entityRecycleBin.push(e);
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

function createFacetType(initialState) {
  if (initialFacetStates.length === 32) { throw "The number of facet types is limited to 32."; }
  return initialFacetStates.push(initialState) - 1;
}

function createProcessor (engine, properties) {
  let needsMask = 0;
  (properties.needs || []).forEach(elt => needsMask |= 1 << elt);
  return Object.assign({
    needsMask,
    getFacet: engine.getFacet.bind(engine),
    addFacet: engine.addFacet.bind(engine),
    load () {},
    drop () {},
    prepare () {},
    update (e, delta) {}
  }, properties);
}

function createStage (processorsProperties, entitiesFacets) {
  const engine = createEngine();
  const processors = processorsProperties.map(processorProperties => createProcessor(engine, processorProperties));
  entitiesFacets.forEach(entityFacets => engine.createEntity(entityFacets));
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
        for (let entity of engine.entitiesConcernedBy(processor)) {
          processor.update(entity, delta);
        }
      }
    }
  }
}

return {createFacetType, createStage};
});
