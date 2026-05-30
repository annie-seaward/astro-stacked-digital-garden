import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import { readFileSync } from 'fs';
import remarkWikilinks from './src/lib/remark-wikilinks.mjs';

let slugmap = {};
try {
  slugmap = JSON.parse(readFileSync('./src/data/slugmap.json', 'utf-8'));
} catch {
  // slugmap not yet generated; run `npm run dev` or `npm run build` to generate it
}

export default defineConfig({
  integrations: [preact({ compat: true }), tailwind()],
  markdown: {
    remarkPlugins: [[remarkWikilinks, { slugmap }]],
  },
});
