define(require => { "use strict";

class EntityManager {
  constructor () {
    this.entities = []; // TODO: Implement an efficient storage for facets.
    this.entityRecycleBin = [];
    this.lastEntityId = 0;
    this.lastFacetType = 0;
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
    for (let i = 0; i < facets.length; i += 2) {
      this.addFacet(entityId, facets[i], facets[i + 1]);
    }
    return entityId;
  }

  removeEntity (e) {
    this.entities[e] = undefined;
    this.entityRecycleBin.push(e);
  }

  createFacetType () {
    return this.lastFacetType++;
  }

  addFacet(e, facetType, facet) {
    this.entities[e][facetType] = facet;
  }

  removeFacet(e, facetType) {
    delete this.entities[e][facetType];
  }

  getFacet (e, facetType) {
    return this.entities[e][facetType];
  }
}

class Engine () {
  constructor (processors, entities) {
    this.processors = processors;
    this.entityManager = new EntityManager();
    for (let entity of entities) {
      this.entityManager.addEntity(entity);
    }
  }

  concernedEntities (processor) {
    return [];
  }

  load () {
    for (let processor of processors) {
      processor.onLoad();
    }
  }

  unload () {
    for (let processor of processors) {
      processor.onUnload();
    }
  }

  step (delta) {
    for (let processor of processors) {
      processor.preprocess(delta);
      for (let entity of this.concernedEntities(processor)) {
        processor.process(entity, delta);
      }
    }
  }
}

return {Stage, Engine};
});
