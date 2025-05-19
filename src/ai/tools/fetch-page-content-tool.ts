
/**
 * @fileOverview A Genkit tool to fetch HTML content from a given URL.
 *
 * - fetchPageContentTool - The tool definition.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const FetchPageContentInputSchema = z.object({
  url: z.string().url().describe('The URL to fetch HTML content from.'),
});

export const FetchPageContentOutputSchema = z.object({
  htmlContent: z
    .string()
    .describe('The HTML content of the page. Empty string if fetch fails.'),
});

export const fetchPageContentTool = ai.defineTool(
  {
    name: 'fetchPageContentTool',
    description: 'Fetches the HTML content of a given web page URL.',
    inputSchema: FetchPageContentInputSchema,
    outputSchema: FetchPageContentOutputSchema,
  },
  async (input) => {
    try {
      const response = await fetch(input.url);
      if (!response.ok) {
        console.error(`Failed to fetch ${input.url}: ${response.statusText}`);
        return { htmlContent: '' };
      }
      const html = await response.text();
      return { htmlContent: html };
    } catch (error) {
      console.error(`Error fetching ${input.url}:`, error);
      return { htmlContent: '' };
    }
  }
);
