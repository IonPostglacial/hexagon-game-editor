define(require => { "use strict";

let initialFacetStates = [];

class Engine {
  constructor () {
    this.entities = []; // TODO: Implement an efficient storage for facets.
    this.entitiesFacetsMask = [];
    this.entityRecycleBin = [];
    this.lastEntityId = 0;
  }
  createEntity (facets) {
    const entityId = this.entityRecycleBin.length === 0 ? this.lastEntityId++ : this.entityRecycleBin.pop();
    this.entities[entityId] = [];
    this.entitiesFacetsMask[entityId] = 0;
    for (let i = 0; i < facets.length; i += 2) {
      this.addFacet(entityId, facets[i], facets[i + 1]);
    }
    return entityId;
  }
  *entitiesConcernedBy (processor) {
    for (let entity = 0; entity < this.entities.length; entity++) {
      if (this.entities[entity] !== undefined && ((processor.needsMask & ~this.entitiesFacetsMask[entity]) === 0)) {
        yield entity;
      }
    }
  }
  removeEntity (e) {
    this.entities[e] = undefined;
    this.entityRecycleBin.push(e);
  }
  addFacet(e, facetType, facet) {
    this.entitiesFacetsMask[e] |= 1 << facetType;
    this.entities[e][facetType] = facet;
  }
  removeFacet(e, facetType) {
    this.entitiesFacetsMask[e] &= ~(1 << facetType);
    delete this.entities[e][facetType];
  }
  getFacet (e, facetType) {
    return this.entities[e][facetType];
  }
}

function FacetType(initialState) {
  if (initialFacetStates.length === 32) { throw "The number of facet types is limited to 32."; }
  return initialFacetStates.push(initialState) - 1;
}

function newProcessor (engine, properties) {
  let needsMask = 0;
  (properties.needs || []).forEach(elt => needsMask |= 1 << elt);
  return Object.assign({
    needsMask,
    getFacet: engine.getFacet.bind(engine),
    addFacet: engine.addFacet.bind(engine),
    onLoad () {},
    onDrop () {},
    preprocess () {},
    process (e, delta) {}
  }, properties);
}

class Stage {
  constructor (processorsProperties, entitiesFacets) {
    this.engine = new Engine();
    for (let entityFacets of entitiesFacets) {
      this.engine.createEntity(entityFacets);
    }
    this.processors = processorsProperties.map(processorProperties => newProcessor(this.engine, processorProperties));
  }
  concernedEntities (processor) {
    return this.engine.entitiesConcernedBy(processor);
  }
  load () {
    for (let processor of this.processors) {
      processor.onLoad();
    }
  }
  unload () {
    for (let processor of this.processors) {
      processor.onDrop();
    }
  }
  step (delta) {
    for (let processor of this.processors) {
      processor.preprocess(delta);
      for (let entity of this.concernedEntities(processor)) {
        processor.process(entity, delta);
      }
    }
  }
}

return {FacetType, Stage};
});
