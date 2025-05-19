
export type PuntosSegurosInfo = {
  totalPuntos: number;
  categoriasPuntos: Record<string, number>; // e.g., { "Comisaría": 2, "Hospital": 1 }
};

export type BarrioOverlapData = {
  barrioName: string;
  overlapType: 'total' | 'partial' | 'none'; // Overlap with the user-marked area in the image
  overlapPercentage?: number; // Percentage of the marked area that overlaps with the barrio
  barrioPolygonCoordinates?: number[][]; // Coordinates defining the boundary of the identified barrio itself
  puntosCbaSegura?: PuntosSegurosInfo; // Info about cbasegura.com.ar points within this barrio
};

export type IdentifyBarriosOutput = BarrioOverlapData[];
