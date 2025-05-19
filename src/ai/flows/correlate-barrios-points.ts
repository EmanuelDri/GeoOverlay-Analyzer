
'use server';
/**
 * @fileOverview Correlates identified barrios with a list of external points of interest.
 *
 * - correlateBarriosWithPoints - A function that takes identified barrios and a JSON string of points,
 *   and returns the barrios enriched with information about which points fall within them.
 * - CorrelateBarriosWithPointsInput - The input type.
 * - IdentifyBarriosOutput - The return type (reused from global types).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { IdentifyBarriosOutput, BarrioOverlapData } from '@/types';

// Define the schemas for this specific flow's Zod validation and prompt typing.
// These will align with the global types.

const PuntosSegurosInfoSchema = z.object({
  totalPuntos: z.number().describe('Total number of external points in this barrio.'),
  categoriasPuntos: z.record(z.string(), z.number()).describe('Count of external points per category. E.g., {"Comisaría": 2, "Hospital": 1}'),
});

const BarrioInputSchemaForCorrelation = z.object({
  barrioName: z.string(),
  overlapType: z.enum(['total', 'partial', 'none']),
  overlapPercentage: z.number().optional(),
  barrioPolygonCoordinates: z.array(z.array(z.number()).length(2)).optional().describe('The geographic coordinates defining the boundary of the identified barrio, as an array of [longitude, latitude] pairs.'),
  // puntosCbaSegura is optional here as input, as it will be populated by this flow.
  puntosCbaSegura: PuntosSegurosInfoSchema.optional(),
});

const CorrelateBarriosWithPointsInputSchema = z.object({
  identifiedBarriosJson: z.string().describe("A JSON string representing an array of identified barrio objects. Each barrio object must contain at least 'barrioName' and 'barrioPolygonCoordinates'."),
  puntosCbaSeguraJson: z
    .string()
    .describe(
      "A JSON string representing an array of points of interest. Each point object must contain 'lat' (latitude), 'lng' (longitude), and 'categoria' (category string). Example: '[{\"lat\": -31.41, \"lng\": -64.18, \"categoria\": \"Comisaría\", \"nombre\": \"Central\"}]'"
    ),
});
export type CorrelateBarriosWithPointsInput = z.infer<typeof CorrelateBarriosWithPointsInputSchema>;

// The output schema for the prompt should match the global IdentifyBarriosOutput structure
const OutputBarrioSchema = BarrioInputSchemaForCorrelation.extend({
    puntosCbaSegura: PuntosSegurosInfoSchema.optional(), // Now it can be populated
});
const CorrelateBarriosWithPointsOutputSchema = z.array(OutputBarrioSchema);


export async function correlateBarriosWithPoints(
  input: CorrelateBarriosWithPointsInput
): Promise<IdentifyBarriosOutput> {
  const result = await correlateBarriosWithPointsFlow(input);
  return result as IdentifyBarriosOutput; // Cast to ensure it matches the global type for the function signature
}

const correlationPrompt = ai.definePrompt({
  name: 'correlateBarriosWithPointsPrompt',
  input: {schema: CorrelateBarriosWithPointsInputSchema},
  output: {schema: CorrelateBarriosWithPointsOutputSchema},
  prompt: `You are a geospatial analysis assistant. You are given:
1.  A JSON string representing a list of identified barrios in Cordoba, Argentina ('identifiedBarriosJson'). Each barrio object includes its name and its boundary polygon coordinates ('barrioPolygonCoordinates', an array of [longitude, latitude] pairs).
2.  A JSON string representing a list of points of interest ('puntosCbaSeguraJson'). Each point object has 'lat' (latitude), 'lng' (longitude), and 'categoria' (category).

Identified Barrios JSON:
{{{identifiedBarriosJson}}}

Points of Interest JSON:
{{{puntosCbaSeguraJson}}}

Your task is to process the 'identifiedBarriosJson' and for each barrio, determine which points from 'puntosCbaSeguraJson' fall geographically within its 'barrioPolygonCoordinates'.
You must then update each barrio object by adding or modifying a 'puntosCbaSegura' field. This field should be an object containing:
-   'totalPuntos': An integer representing the total number of points of interest from 'puntosCbaSeguraJson' that fall within that barrio.
-   'categoriasPuntos': An object where keys are category names (from 'categoria' in 'puntosCbaSeguraJson') and values are the count of points of that category within the barrio. Example: {"Comisaría": 2, "Centro Vecinal": 1}.

If a barrio has no points of interest within it, 'totalPuntos' should be 0, and 'categoriasPuntos' should be an empty object {}.
If a barrio object in 'identifiedBarriosJson' is missing 'barrioPolygonCoordinates' or they are invalid, you should still include the barrio in the output but its 'puntosCbaSegura' field might indicate no points found or be omitted, and you can log a note about why analysis couldn't be performed for that specific barrio in the 'puntosCbaSegura' field or a new notes field if absolutely necessary.

Return the full list of barrios as a JSON array, where each barrio object is updated with the 'puntosCbaSegura' field as described. The structure of each barrio object in the output array should otherwise remain the same as in the input 'identifiedBarriosJson', but with the 'puntosCbaSegura' field correctly populated.
Make sure the coordinates are interpreted correctly: 'barrioPolygonCoordinates' are [longitude, latitude] and points have 'lat' and 'lng'.
`,
});

const correlateBarriosWithPointsFlow = ai.defineFlow(
  {
    name: 'correlateBarriosWithPointsFlow',
    inputSchema: CorrelateBarriosWithPointsInputSchema,
    outputSchema: CorrelateBarriosWithPointsOutputSchema,
  },
  async (input: CorrelateBarriosWithPointsInput) => {
    // Ensure valid JSON is parsed before sending to prompt, or let the prompt handle it if robust enough.
    // For simplicity, we assume the prompt can handle JSON strings directly.
    const {output} = await correlationPrompt(input);
    return output!;
  }
);
