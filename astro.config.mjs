import { readFileSync } from 'node:fs';

import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import remarkWikilinks from './src/lib/remark-wikilinks.mjs';

let slugmap = {};
try {
  slugmap = JSON.parse(readFileSync('./src/data/slugmap.json', 'utf-8'));
} catch {
  // slugmap not yet generated; run `npm run dev` or `npm run build` to generate it
}

export default defineConfig({
  integrations: [preact({ compat: true })],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [[remarkWikilinks, { slugmap }]],
  },
});
