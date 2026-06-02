#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

const [title, folder] = argv.slice(2);

if (!title) {
  console.error('Usage: npm run new -- <title> [folder]');
  exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const date = new Date().toISOString().slice(0, 10);

const frontmatter = `---
title: "${title}"
date: ${date}
tags: []
draft: false
---

`;

const root = join(dirname(fileURLToPath(import.meta.url)), '../../');
const notesDir = folder
  ? join(root, 'src/content/notes', folder)
  : join(root, 'src/content/notes');
const filePath = join(notesDir, `${slug}.md`);
const displayPath = folder ? `src/content/notes/${folder}/${slug}.md` : `src/content/notes/${slug}.md`;

// eslint-disable-next-line security/detect-non-literal-fs-filename
if (existsSync(filePath)) {
  console.error(`Note already exists: ${displayPath}`);
  exit(1);
}

mkdirSync(notesDir, { recursive: true });
// eslint-disable-next-line security/detect-non-literal-fs-filename
writeFileSync(filePath, frontmatter);
console.log(`Created: ${displayPath}`);
