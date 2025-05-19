export type BarrioOverlapData = {
  barrioName: string;
  overlapType: 'total' | 'partial' | 'none';
  overlapPercentage?: number;
  polygonCoordinates?: number[][];
};

export type IdentifyBarriosOutput = BarrioOverlapData[];
