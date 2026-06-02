# Astro Stacked Digital Garden

Astro SSG digital garden with stacked note panels. Preact islands for interactivity, Tailwind for styling, Markdown with `[[wikilink]]` syntax.

## Commands

```bash
npm run dev      # dev server (runs build-backlinks first)
npm run build    # production build (runs build-backlinks first)
npm run preview  # preview dist/
npm run lint     # ESLint
npm run lint:fix # ESLint autofix
```

## Key paths

| Path | Purpose |
|---|---|
| `src/content/notes/` | All Markdown notes (the vault) |
| `src/data/backlinks.json` | Generated — do not edit |
| `src/data/slugmap.json` | Generated — do not edit |
| `src/scripts/build-backlinks.mjs` | Pre-build indexer |
| `src/lib/remark-wikilinks.mjs` | Remark plugin — parses `[[...]]` |
| `src/lib/topics.ts` | Sidebar topic generator |
| `src/lib/backlinks.ts` | Backlinks loader |
| `src/components/StackedGarden.tsx` | Preact island — panel stack state, URL sync |
| `src/components/NotePanel.tsx` | Preact — single panel, obstructed/highlight states |
| `src/components/Sidebar.astro` | Static sidebar with topic nav + dark mode toggle |
| `src/layouts/NoteLayout.astro` | Note page shell — sidebar + stacked garden |
| `src/content.config.ts` | Astro content collection schema |
| `astro.config.mjs` | Astro config — loads slugmap, registers remark plugin |

## Content model

Notes are `.md` files in `src/content/notes/`. Frontmatter is optional:

```yaml
---
title: "My Note"         # falls back to filename
date: 2024-11-01
tags: [concept, idea]
draft: false             # true = excluded from build
aliases: ["Old Name"]    # alternative wikilink targets
---
```

Top-level folders in `src/content/notes/` become sidebar topics automatically. Prefix a folder with `_` to hide it from the sidebar (e.g. `_drafts/`).

`src/content/notes/index.md` is the home page, served at `/`.

## Wikilinks

```markdown
[[Note Title]]                    # link by title or filename
[[Note Title|Custom label]]       # custom display text
```

Links are resolved case-insensitively via `slugmap.json`. Unresolved links render with `.wikilink-broken` class (styled, not broken).

## Build pipeline

1. `build-backlinks.mjs` runs before every dev/build (via `predev`/`prebuild` hooks)
2. Crawls all `.md` files, extracts titles/aliases, parses wikilinks
3. Writes `src/data/backlinks.json` (slug → referencing notes) and `src/data/slugmap.json` (title slug → full path slug)
4. `astro.config.mjs` passes `slugmap.json` to `remark-wikilinks`
5. Remark plugin rewrites `[[...]]` nodes to `<a data-slug="...">` during Markdown compilation
6. `StackedGarden.tsx` intercepts wikilink clicks client-side to open panels

**After adding or renaming notes:** `npm run dev` regenerates the index automatically. If running build in CI, the `prebuild` hook handles it.

## Stacked panel state

- Primary note: the `/notes/[slug]` in the URL path
- Additional panels: `?stack=slug-a,slug-b` query param
- Panel state lives in `StackedGarden.tsx` — URL is the source of truth
- Back/forward navigation via `popstate` listener
- Obstructed state: panels too narrow to display fully collapse to 48px vertical tabs

## Styling

- Tailwind utility classes throughout
- Dark mode: `class` strategy — `dark` class on `<html>` toggled by Sidebar button, persisted to `localStorage`
- Animations in `src/styles/global.css` (panel slide-in, highlight flash, theme reveal)
- Typography: `@tailwindcss/typography` prose class on note content

## Constraints

- `src/data/*.json` are generated files — never edit by hand; run `npm run dev` to regenerate
- Components in `*.tsx` are Preact, not React — no React-specific APIs (`ReactDOM`, etc.)
- Sidebar is static Astro — no client state. Interactive bits belong in `StackedGarden.tsx`
- Notes must be `.md` (not `.mdx`) unless the content collection config is updated
