'use server';

/**
 * @fileOverview Identifies Cordoba barrios overlapping with areas marked in an image using Google Maps and vector analysis.
 *
 * - identifyBarriosFromImage - A function that identifies barrios based on image overlap.
 * - IdentifyBarriosFromImageInput - The input type for the identifyBarriosFromImage function.
 * - IdentifyBarriosFromImageOutput - The return type for the identifyBarriosFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyBarriosFromImageInputSchema = z.object({
  imageUri: z
    .string()
    .describe(
      "An image with marked areas, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyBarriosFromImageInput = z.infer<typeof IdentifyBarriosFromImageInputSchema>;

const BarrioOverlapSchema = z.object({
  barrioName: z.string().describe('The name of the Cordoba barrio.'),
  overlapType: z
    .enum(['total', 'partial', 'none'])
    .describe('The type of overlap (total, partial, or none).'),
  overlapPercentage: z
    .number()
    .optional()
    .describe('The percentage of overlap (only for partial overlaps).'),
  polygonCoordinates:
    z.array(z.array(z.number()).length(2)).optional().describe('The coordinates of the polygon where the barrio and marked area overlap (only for partial overlaps).'),
});

const IdentifyBarriosFromImageOutputSchema = z.array(BarrioOverlapSchema);

export type IdentifyBarriosFromImageOutput = z.infer<typeof IdentifyBarriosFromImageOutputSchema>;

export async function identifyBarriosFromImage(
  input: IdentifyBarriosFromImageInput
): Promise<IdentifyBarriosFromImageOutput> {
  return identifyBarriosFromImageFlow(input);
}

const identifyBarriosFromImagePrompt = ai.definePrompt({
  name: 'identifyBarriosFromImagePrompt',
  input: {schema: IdentifyBarriosFromImageInputSchema},
  output: {schema: IdentifyBarriosFromImageOutputSchema},
  prompt: `You are an expert in geospatial analysis and Cordoba geography.

  Analyze the image provided to identify which barrios in Cordoba, Argentina, overlap with the areas marked in the image.

  For each barrio, determine if the overlap is total, partial, or none. If the overlap is partial, provide an estimated percentage of overlap and the coordinates of the overlapping polygon.

  Use the following image as your primary source of information:
  {{media url=imageUri}}

  Present your analysis in a structured format, listing each barrio and its corresponding overlap status, percentage (if partial), and polygon coordinates (if partial).

  The output should be a JSON array, where each object contains barrioName, overlapType, overlapPercentage, and polygonCoordinates.
`,
});

const identifyBarriosFromImageFlow = ai.defineFlow(
  {
    name: 'identifyBarriosFromImageFlow',
    inputSchema: IdentifyBarriosFromImageInputSchema,
    outputSchema: IdentifyBarriosFromImageOutputSchema,
  },
  async input => {
    const {output} = await identifyBarriosFromImagePrompt(input);
    return output!;
  }
);
