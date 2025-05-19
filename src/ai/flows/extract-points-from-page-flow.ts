
'use server';
/**
 * @fileOverview A Genkit flow to attempt extracting points of interest from a webpage's HTML.
 *
 * - extractPointsFromPage - A function that orchestrates fetching HTML and then extracting points.
 * - ExtractPointsFromPageInput - The input type.
 * - ExtractPointsFromPageOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchPageContentTool, FetchPageContentInputSchema } from '@/ai/tools/fetch-page-content-tool';

const ExtractPointsFromPageInputSchema = z.object({
  targetUrl: z.string().url().describe('The URL from which to extract points of interest. e.g., a page from cbasegura.com.ar'),
});
export type ExtractPointsFromPageInput = z.infer<typeof ExtractPointsFromPageInputSchema>;

const ExtractedPointsSchema = z.array(
  z.object({
    lat: z.number().describe('Latitude of the point.'),
    lng: z.number().describe('Longitude of the point.'),
    categoria: z.string().describe('Category of the point (e.g., "Comisaría", "Hospital").'),
    nombre: z.string().optional().describe('Name of the point of interest (optional).'),
  })
);

const ExtractPointsFromPageOutputSchema = z.object({
  extractedPointsJson: z.string().describe("A JSON string representing an array of extracted points of interest. Each point should have 'lat', 'lng', 'categoria', and optionally 'nombre'. Returns an empty array '[]' string if no points are found or extraction fails."),
});
export type ExtractPointsFromPageOutput = z.infer<typeof ExtractPointsFromPageOutputSchema>;

export async function extractPointsFromPage(
  input: ExtractPointsFromPageInput
): Promise<ExtractPointsFromPageOutput> {
  return extractPointsFromPageFlow(input);
}

const extractionPrompt = ai.definePrompt({
  name: 'extractPointsFromPagePrompt',
  input: { schema: z.object({ pageHtmlContent: z.string() }) },
  output: { schema: ExtractedPointsSchema }, // The prompt should directly output the array of points
  tools: [], // No tools needed for this specific prompt, it just processes text
  prompt: `
    You are an expert data extraction assistant. You are given the HTML content of a web page.
    Your task is to meticulously analyze this HTML to find and extract information about points of interest
    (like police stations, hospitals, community centers, etc.) relevant to a security map.

    HTML Content:
    \`\`\`html
    {{{pageHtmlContent}}}
    \`\`\`

    Extract the following details for each point of interest you can find:
    -   \`lat\`: Latitude (must be a number).
    -   \`lng\`: Longitude (must be a number).
    -   \`categoria\`: The category of the point (e.g., "Comisaría", "Hospital", "Centro Vecinal").
    -   \`nombre\`: The name of the point of interest (if available, otherwise can be omitted).

    Look for patterns in the HTML that might contain this data, such as embedded JSON in script tags (like \`window.mapData = [...]\` or similar), data attributes on HTML elements, or structured lists/tables.
    Prioritize data that seems to be part of a map's dataset.

    Return your findings as a JSON array of objects. Each object should represent one point of interest.
    If you cannot find any points, or if the HTML does not seem to contain such data, return an empty JSON array: [].
    Do not include any explanations or surrounding text in your output, only the JSON array itself.
  `,
});


const extractPointsFromPageFlow = ai.defineFlow(
  {
    name: 'extractPointsFromPageFlow',
    inputSchema: ExtractPointsFromPageInputSchema,
    outputSchema: ExtractPointsFromPageOutputSchema,
    tools: [fetchPageContentTool], // This flow can use the fetchPageContentTool
  },
  async (input: ExtractPointsFromPageInput) => {
    const { htmlContent } = await fetchPageContentTool({ url: input.targetUrl });

    if (!htmlContent || htmlContent.trim() === '') {
      console.warn(`No HTML content fetched from ${input.targetUrl}, or content was empty.`);
      return { extractedPointsJson: "[]" };
    }

    // Limit HTML content size to avoid overwhelming the LLM or hitting token limits
    // This limit is arbitrary and might need adjustment.
    const MAX_HTML_LENGTH = 200000; // Approx 200KB
    let effectiveHtmlContent = htmlContent;
    if (htmlContent.length > MAX_HTML_LENGTH) {
        console.warn(`HTML content from ${input.targetUrl} is very large (${htmlContent.length} chars), truncating to ${MAX_HTML_LENGTH} chars for LLM processing.`);
        effectiveHtmlContent = htmlContent.substring(0, MAX_HTML_LENGTH);
    }
    
    try {
      const { output } = await extractionPrompt({ pageHtmlContent: effectiveHtmlContent });
      if (output) {
        return { extractedPointsJson: JSON.stringify(output) };
      }
      console.warn(`LLM did not return output for point extraction from ${input.targetUrl}.`);
      return { extractedPointsJson: "[]" };

    } catch (e) {
      console.error(`Error during LLM point extraction for ${input.targetUrl}:`, e);
      return { extractedPointsJson: "[]" };
    }
  }
);
