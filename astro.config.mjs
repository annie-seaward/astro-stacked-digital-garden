import { readFileSync } from 'node:fs';

import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

import remarkWikilinks from './src/lib/remark-wikilinks.mjs';

let slugmap = {};
try {
  slugmap = JSON.parse(readFileSync('./src/data/slugmap.json', 'utf-8'));
} catch {
  // slugmap not yet generated; run `npm run dev` or `npm run build` to generate it
}

export default defineConfig({
  site: 'https://annie-seaward.github.io',
  base:
    import.meta.env.MODE === 'development'
      ? '/'
      : '/astro-stacked-digital-garden',
  integrations: [preact({ compat: true }), tailwind()],
  markdown: {
    remarkPlugins: [[remarkWikilinks, { slugmap }]],
  },
});
