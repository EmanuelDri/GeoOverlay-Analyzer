
'use server';

/**
 * @fileOverview Identifies Cordoba barrios overlapping with areas marked in an image.
 * It also attempts to return the polygon coordinates for the identified barrios.
 *
 * - identifyBarriosFromImage - A function that identifies barrios based on image overlap.
 * - IdentifyBarriosFromImageInput - The input type for the identifyBarriosFromImage function.
 * - IdentifyBarriosFromImageOutput - The return type for the identifyBarriosFromImage function (defined in @/types).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { IdentifyBarriosOutput } from '@/types'; // Import general output type

// Define PuntosSegurosInfoSchema here for local schema consistency if needed, or rely on global type.
// For clarity, we'll define the output schema explicitly for this flow.

const PuntosSegurosInfoSchema = z.object({
  totalPuntos: z.number().describe('Total number of external points in this barrio.'),
  categoriasPuntos: z.record(z.string(), z.number()).describe('Count of external points per category.'),
}).optional();


const BarrioOutputSchema = z.object({
  barrioName: z.string().describe('The name of the Cordoba barrio.'),
  overlapType: z
    .enum(['total', 'partial', 'none'])
    .describe('The type of overlap with the marked area in the image (total, partial, or none).'),
  overlapPercentage: z
    .number()
    .optional()
    .describe('The percentage of the marked area that overlaps with the barrio (only for partial overlaps with the marked area).'),
  barrioPolygonCoordinates: z
    .array(z.array(z.number()).length(2))
    .optional()
    .describe('The geographic coordinates defining the boundary of the identified barrio, as an array of [longitude, latitude] pairs. This should represent the entire barrio, not just the overlapping part.'),
  puntosCbaSegura: PuntosSegurosInfoSchema.describe("Information about cbasegura.com.ar points. This flow will not populate it; another flow will.").optional(),
});

const IdentifyBarriosFromImageOutputSchema = z.array(BarrioOutputSchema);

const IdentifyBarriosFromImageInputSchema = z.object({
  imageUri: z
    .string()
    .describe(
      "An image with marked areas, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyBarriosFromImageInput = z.infer<typeof IdentifyBarriosFromImageInputSchema>;


export async function identifyBarriosFromImage(
  input: IdentifyBarriosFromImageInput
): Promise<IdentifyBarriosOutput> { // Using the global type for the function's promise
  const result = await identifyBarriosFromImageFlow(input);
  // Ensure the result matches the global IdentifyBarriosOutput type,
  // even if this specific flow doesn't populate all optional fields like puntosCbaSegura.
  return result as IdentifyBarriosOutput;
}

const identifyBarriosFromImagePrompt = ai.definePrompt({
  name: 'identifyBarriosFromImagePrompt',
  input: {schema: IdentifyBarriosFromImageInputSchema},
  output: {schema: IdentifyBarriosFromImageOutputSchema}, // Use the locally defined output schema for the prompt
  prompt: `You are an expert in geospatial analysis and Cordoba, Argentina geography.

  Analyze the image provided to identify which barrios (neighborhoods) in Cordoba, Argentina, are present or overlap with any specially marked or shaded areas in the image.

  For each barrio you identify:
  1.  **barrioName**: The name of the barrio.
  2.  **overlapType**: Determine if its overlap with a marked/shaded area is 'total', 'partial', or 'none'. If no specific area is marked, focus on identifying barrios visible.
  3.  **overlapPercentage**: If 'partial' overlap, estimate the percentage of the marked/shaded area that this barrio covers. Omit if 'total' or 'none'.
  4.  **barrioPolygonCoordinates**: Crucially, for *every* barrio identified (regardless of its overlapType with a marked area), provide the geographic coordinates that define its approximate boundary. These coordinates should be an array of [longitude, latitude] pairs, forming a polygon. Example: [[-64.18, -31.41], [-64.17, -31.41], [-64.17, -31.42], [-64.18, -31.42], [-64.18, -31.41]].

  Use the following image as your primary source of information:
  {{media url=imageUri}}

  Present your analysis as a JSON array of objects, where each object conforms to the defined output schema (barrioName, overlapType, overlapPercentage, barrioPolygonCoordinates).
  The field 'puntosCbaSegura' should not be populated by this prompt.
`,
});

const identifyBarriosFromImageFlow = ai.defineFlow(
  {
    name: 'identifyBarriosFromImageFlow',
    inputSchema: IdentifyBarriosFromImageInputSchema,
    outputSchema: IdentifyBarriosFromImageOutputSchema, // Matches prompt's output schema
  },
  async input => {
    const {output} = await identifyBarriosFromImagePrompt(input);
    return output!;
  }
);
