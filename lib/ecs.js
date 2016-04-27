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
