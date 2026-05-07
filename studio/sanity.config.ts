import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';

import { schemaTypes } from './schemaTypes';

export default defineConfig({
  name: 'default',
  title: 'Chùa Quan Âm — CMS',

  projectId: '13i7s9vj',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: { types: schemaTypes },
});
