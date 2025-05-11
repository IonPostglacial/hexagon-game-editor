export type PointType = { x: number; y: number };

export type GridType = Immutable.RecordOf<{
  width: number;
  height: number;
  radius: number;
  tiles: Immutable.Map<PointType, number>;
}>;