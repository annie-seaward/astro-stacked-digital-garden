import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..');
const notesDir = join(root, 'src', 'content', 'notes');
const outDir = join(root, 'src', 'data');

function slugify(text) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function fileSlug(filePath) {
  const rel = relative(notesDir, filePath);
  return rel.replace(/\/index\.md$/, '').replace(/\.md$/, '').replace(/\\/g, '/');
}

function getAllMdFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...getAllMdFiles(full));
    } else if (entry.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

const files = getAllMdFiles(notesDir);

// Build title→slug registry
const registry = {};
for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const slug = fileSlug(file);
  const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch ? titleMatch[1] : basename(file, '.md');
  registry[slugify(title)] = slug;
  registry[slug] = slug;
}

// Build backlinks map
const backlinks = {};

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const sourceSlug = fileSlug(file);
  const sourceTitleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const sourceTitle = sourceTitleMatch ? sourceTitleMatch[1] : basename(file, '.md');

  const wikilinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match;
  while ((match = wikilinkRegex.exec(content)) !== null) {
    const target = match[1].trim();
    const targetSlug = registry[slugify(target)] || registry[target] || slugify(target);
    if (!backlinks[targetSlug]) backlinks[targetSlug] = [];
    if (!backlinks[targetSlug].find(b => b.slug === sourceSlug)) {
      backlinks[targetSlug].push({ slug: sourceSlug, title: sourceTitle });
    }
  }
}

// Build slugmap: simple-slug → full-slug (for wikilink resolution)
// e.g. "stoicism" → "philosophy/stoicism"
const slugmap = {};
for (const [key, fullSlug] of Object.entries(registry)) {
  // key is either the slugified title or the full slug itself
  const simpleSlug = fullSlug.split('/').pop();
  if (simpleSlug && !slugmap[simpleSlug]) {
    slugmap[simpleSlug] = fullSlug;
  }
  // also map the full slug to itself
  slugmap[fullSlug] = fullSlug;
  // and map the key to the full slug
  if (!slugmap[key]) slugmap[key] = fullSlug;
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'backlinks.json'), JSON.stringify(backlinks, null, 2));
writeFileSync(join(outDir, 'slugmap.json'), JSON.stringify(slugmap, null, 2));
console.log('Backlinks built:', Object.keys(backlinks).length, 'targets');
console.log('Slugmap built:', Object.keys(slugmap).length, 'entries');
