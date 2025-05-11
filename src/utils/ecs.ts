type Facet = Record<string, any>;
type EntityId = number;

interface ProcessorProperties {
  needs?: number[];
  load?: () => void;
  drop?: () => void;
  prepare?: (delta: number) => void;
  step?: (facetsAccessors: FacetsAccessors, entity: EntityId, delta: number) => void;
}

interface FacetsAccessors {
  get(entity: EntityId, facetType: number): Facet | undefined;
  set(entity: EntityId, facetType: number, facet: Facet): void;
  del(entity: EntityId, facetType: number): void;
}

function createEntityContainer() {
  const entities: (Facet[] | undefined)[] = [];
  const entitiesFacetsMask: number[] = [];
  const entityRecycleBin: EntityId[] = [];
  let lastEntityId: EntityId = 0;

  function addFacet(e: EntityId, facetType: number, facet: Facet) {
    entitiesFacetsMask[e] |= 1 << facetType;
    entities[e]![facetType] = facet;
  }

  function removeFacet(e: EntityId, facetType: number) {
    entitiesFacetsMask[e] &= ~(1 << facetType);
    delete entities[e]![facetType];
  }

  function getFacet(e: EntityId, facetType: number): Facet | undefined {
    return entities[e]?.[facetType];
  }

  return {
    create(facets: any[]): EntityId {
      let entityId = entityRecycleBin.pop();
      if (entityId === undefined) {
        entityId = lastEntityId++;
      }
      entities[entityId] = [];
      entitiesFacetsMask[entityId] = 0;
      for (let i = 0; i < facets.length; i += 2) {
        addFacet(entityId, facets[i], facets[i + 1]);
      }
      return entityId;
    },
    remove(e: EntityId) {
      entities[e] = undefined;
      entityRecycleBin.push(e);
    },
    *processableBy(processor: { needsMask: number }) {
      for (let entity = 0; entity < entities.length; entity++) {
        if (
          entities[entity] !== undefined &&
          (processor.needsMask & ~entitiesFacetsMask[entity]) === 0
        ) {
          yield entity;
        }
      }
    },
    addFacet,
    removeFacet,
    getFacet,
  };
}

function createFacetTypes(initialStates: Record<string, any>): Record<string, number> {
  if (Object.keys(initialStates).length === 32) {
    throw new Error("The number of facet types is limited to 32.");
  }
  const types: Record<string, number> = {};
  Object.keys(initialStates).forEach((type, index) => (types[type] = index));
  return types;
}

function createProcessor(
  entities: ReturnType<typeof createEntityContainer>,
  { needs, load, drop, prepare, step }: ProcessorProperties
) {
  const noop = () => {};
  const facetsAccessors: FacetsAccessors = {
    get(entity, facetType) {
      return entities.getFacet(entity, facetType);
    },
    set(entity, facetType, facet) {
      entities.addFacet(entity, facetType, facet);
    },
    del(entity, facetType) {
      entities.removeFacet(entity, facetType);
    },
  };

  return {
    needsMask: (needs || []).reduce((needsMask, elt) => needsMask | (1 << elt), 0),
    load: load || noop,
    prepare: prepare || noop,
    step(entity: EntityId, delta: number) {
      if (step) {
        step(facetsAccessors, entity, delta);
      }
    },
    drop: drop || noop,
  };
}

function createWorld(
  processorsProperties: ProcessorProperties[],
  entitiesFacets: any[][]
) {
  const entities = createEntityContainer();
  const processors = processorsProperties.map((processorProperties) =>
    createProcessor(entities, processorProperties)
  );
  entitiesFacets.forEach((entityFacets) => entities.create(entityFacets));
  return {
    load() {
      processors.forEach((processor) => processor.load());
    },
    drop() {
      processors.forEach((processor) => processor.drop());
    },
    step(delta: number) {
      for (let processor of processors) {
        processor.prepare(delta);
        for (let entity of entities.processableBy(processor)) {
          processor.step(entity, delta);
        }
      }
    },
  };
}

export { createFacetTypes, createWorld };