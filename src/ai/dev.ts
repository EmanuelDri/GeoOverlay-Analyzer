
import { config } from 'dotenv';
config();

import '@/ai/tools/fetch-page-content-tool.ts'; // Import the new tool
import '@/ai/flows/generate-polygon-coordinates.ts';
import '@/ai/flows/identify-barrios-from-image.ts';
import '@/ai/flows/calculate-overlap-percentage.ts';
import '@/ai/flows/correlate-barrios-points.ts';
import '@/ai/flows/extract-points-from-page-flow.ts'; // Import the new flow
