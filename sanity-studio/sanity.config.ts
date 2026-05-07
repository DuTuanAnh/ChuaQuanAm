import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import { schemaTypes } from './schemas';

/**
 * Sanity Studio config for Chùa Quan Âm.
 *
 * Set `projectId` to your real id from https://www.sanity.io/manage and use
 * the SAME id in:
 *   - website-chua-quan-am/src/environments/environment.development.ts → sanityProjectId
 *   - server/.env → SANITY_PROJECT_ID
 */
export default defineConfig({
  name: 'default',
  title: 'Chùa Quan Âm — Sanity Studio',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool(), visionTool()],

  schema: { types: schemaTypes },
});
