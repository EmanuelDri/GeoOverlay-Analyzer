//GeneratePolygonCoordinates story
'use server';

/**
 * @fileOverview Generates polygon coordinates for overlapping barrios.
 *
 * - generatePolygonCoordinates - A function that generates polygon coordinates for overlapping barrios.
 * - GeneratePolygonCoordinatesInput - The input type for the generatePolygonCoordinates function.
 * - GeneratePolygonCoordinatesOutput - The return type for the generatePolygonCoordinates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePolygonCoordinatesInputSchema = z.object({
  barrioName: z.string().describe('The name of the barrio.'),
  overlayPercentage: z.number().describe('The percentage of overlap with the shaded area.'),
  imageWithOverlayDataUri: z
    .string()
    .describe(
      "A map image with overlaid shaded areas as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GeneratePolygonCoordinatesInput = z.infer<typeof GeneratePolygonCoordinatesInputSchema>;

const GeneratePolygonCoordinatesOutputSchema = z.object({
  polygonCoordinates: z
    .array(z.object({lat: z.number(), lng: z.number()}))
    .describe('The array of lat/lng coordinates of the overlapping polygon.'),
});
export type GeneratePolygonCoordinatesOutput = z.infer<typeof GeneratePolygonCoordinatesOutputSchema>;

export async function generatePolygonCoordinates(input: GeneratePolygonCoordinatesInput): Promise<GeneratePolygonCoordinatesOutput> {
  return generatePolygonCoordinatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePolygonCoordinatesPrompt',
  input: {schema: GeneratePolygonCoordinatesInputSchema},
  output: {schema: GeneratePolygonCoordinatesOutputSchema},
  prompt: `You are a geospatial analysis expert. You are provided with the name of a barrio in Cordoba, Argentina, the percentage of overlap it has with a shaded area on a map, and the map image itself.

  Your task is to generate the coordinates (latitude and longitude) of the polygon that represents the overlapping area within the specified barrio.

  Barrio Name: {{{barrioName}}}
  Overlap Percentage: {{{overlayPercentage}}}
  Map Image with Overlay: {{media url=imageWithOverlayDataUri}}

  Provide the polygon coordinates as an array of objects, where each object has 'lat' and 'lng' properties.
  Ensure that the coordinates accurately represent the overlapping area on the provided map image.
  Consider the overlap percentage when determining the precision of the coordinates.
  `,
});

const generatePolygonCoordinatesFlow = ai.defineFlow(
  {
    name: 'generatePolygonCoordinatesFlow',
    inputSchema: GeneratePolygonCoordinatesInputSchema,
    outputSchema: GeneratePolygonCoordinatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
