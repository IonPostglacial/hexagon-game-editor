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
    let entityId;
    if (this.entityRecycleBin.length !== 0) {
      entityId = this.entityRecycleBin.pop();
    } else {
      entityId = this.lastEntityId;
      this.lastEntityId++;
    }
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
  initialFacetStates.push(initialState)
  return initialFacetStates.length - 1;
}

function newProcessor (engine, properties) {
  const self = {
    needsMask: 0,
    getFacet: engine.getFacet.bind(engine),
    addFacet: engine.addFacet.bind(engine),
    onLoad () {},
    onDrop () {},
    preprocess () {},
    process (e, delta) {}
  };
  if (properties.needs) {
    for (let need of properties.needs) {
      self.needsMask |= 1 << need;
    }
  }
  for (let property of Object.keys(properties)) {
    self[property] = properties[property];
  }
  return self;
}

class Stage {
  constructor (processorsProperties, engine) {
    this.processors = processorsProperties.map(processorProperties => newProcessor(engine, processorProperties));
    this.engine = engine;
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

return {Engine, FacetType, Stage};
});
