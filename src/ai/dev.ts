import { config } from 'dotenv';
config();

import '@/ai/flows/generate-polygon-coordinates.ts';
import '@/ai/flows/identify-barrios-from-image.ts';
import '@/ai/flows/calculate-overlap-percentage.ts';