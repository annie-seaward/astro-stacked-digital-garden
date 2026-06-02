#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const notesDir = join(scriptDir, '../../src/content/notes');

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length)
      fm[key.trim()] = rest
        .join(':')
        .trim()
        .replace(/^["']|["']$/g, '');
  }
  return fm;
}

function filenameToTitle(filename) {
  return basename(filename, '.md')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function walk(dir, base = notesDir) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const entries = readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, base));
    } else if (entry.name.endsWith('.md')) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const content = readFileSync(full, 'utf8');
      const fm = extractFrontmatter(content);
      if (fm.draft !== 'true') {
        const rel = relative(base, full);
        const slug = rel.replaceAll('.md', '').replaceAll('\\', '/');
        const title = fm.title || filenameToTitle(entry.name);
        results.push({ slug, title });
      }
    } else {
      // non-markdown file, skip
    }
  }
  return results;
}

const notes = walk(notesDir).sort((a, b) => a.slug.localeCompare(b.slug));

const slugWidth = Math.max(4, ...notes.map((n) => n.slug.length));
console.log(`${'SLUG'.padEnd(slugWidth)}  TITLE`);
console.log(`${'-'.repeat(slugWidth)}  -----`);
for (const { slug, title } of notes) {
  console.log(`${slug.padEnd(slugWidth)}  ${title}`);
}
console.log(`\n${notes.length} note${notes.length === 1 ? '' : 's'}`);
