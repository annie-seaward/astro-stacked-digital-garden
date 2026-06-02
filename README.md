# Astro Stacked Digital Garden

A digital garden template built with [Astro](https://astro.build) — write notes in Markdown, link them together with `[[wikilinks]]`, and watch them stack side by side as readers explore.

> **Live demo:** _coming soon_ <!-- update this link once deployed to GitHub Pages -->


## What is this?

A **digital garden** is a personal website where you publish notes, ideas, and writing — not as a traditional blog with dates and feeds, but as an interconnected web of thoughts you tend over time.

This template gives you:

- **Stacked panels** — clicking a link opens the linked note alongside the current one, so readers can explore connections without losing their place
- **`[[Wikilink]]` syntax** — write links the same way you would in Obsidian or Logseq, using `[[Note Title]]`
- **Backlinks** — every note automatically shows which other notes link to it
- **A sidebar** with topic navigation, always visible on desktop
- **Dark mode** with system preference detection
- **Fully static output** — no server needed, deploys to GitHub Pages, Netlify, Vercel, or Cloudflare Pages


## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) v22 or newer
- A terminal you're comfortable running a command or two in

### Setup

**Fork first** — this lets you have your own copy to publish and customise:

1. Click **Fork** (top-right on GitHub) to create a copy under your own account
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/astro-stacked-digital-garden
cd astro-stacked-digital-garden
```

3. Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Then open [http://localhost:4321](http://localhost:4321) in your browser.


## Writing notes

Notes live in `src/content/notes/`. Each note is a Markdown (`.md`) file.

### Folder structure

```
src/content/notes/
  index.md               ← your home/landing note
  philosophy/            ← becomes "Philosophy" in the sidebar
    index.md             ← sidebar link opens this note first (if present)
    stoicism.md
    free-will.md
  language-models/
    note.md
  _drafts/               ← _ prefix = hidden from sidebar
    wip-note.md
  a-loose-note.md        ← root-level notes are fine, but are not shown in the sidebar
```

Top-level folders become sidebar topics automatically — title-cased, hyphens replaced with spaces. No config needed.

### Frontmatter

All fields are optional:

```yaml
---
title: "My Note Title"
date: 2024-11-01
tags: [concept, idea]
draft: false             # true = excluded from the built site
aliases: ["Old Title"]   # alternative names for [[wikilink]] resolution
---
```

If you leave out `title`, the filename is used.

### Linking notes

Use `[[Note Title]]` anywhere in your Markdown to link to another note:

```markdown
I've been thinking about [[Stoicism]] lately, especially its relationship to [[Free Will]].

You can also use [[Note Title|custom link text]] to change what the link says.
```

Links that don't resolve to a real note are shown with a visual indicator rather than breaking.


## Commands

Run these from the project root in your terminal:

| Command                        | What it does                                       |
| :----------------------------- | :------------------------------------------------- |
| `npm run dev`                  | Start a local development server at port 4321      |
| `npm run build`                | Build the static site into `./dist/`               |
| `npm run preview`              | Preview the production build locally before deploy |
| `npm run new -- "Note Title"`              | Create a new note with frontmatter pre-filled      |
| `npm run new -- "Note Title" philosophy`   | Create a note inside a topic folder                |
| `npm run notes`                            | List all non-draft notes with their slug and title |


## Deploying

The build output in `./dist/` is a plain static site — upload it anywhere.

**GitHub Pages:** push to a repo with GitHub Actions and point Pages at the `dist` folder.

**Netlify / Vercel / Cloudflare Pages:** connect your repo, set build command to `npm run build`, output directory to `dist`.


## Adding new content

### Sidebar topics

Sidebar topics are generated automatically from your folder structure — no config needed. Each top-level folder inside `src/content/notes/` becomes a sidebar entry: hyphens are replaced with spaces and the name is title-cased (e.g. `language-models/` → "Language Models"). If the folder has an `index.md`, that's what the sidebar link points to; otherwise it points to the first note in the folder alphabetically. To exclude a folder from the sidebar, prefix its name with `_` (e.g. `_drafts/`).

### Drafts

There are two ways to keep notes out of the public site:

- **`draft: true` in frontmatter** — the note is excluded from the build entirely. It won't be published and any `[[wikilinks]]` pointing to it will show as broken links.
- **`_` folder prefix** (e.g. `_drafts/`) — hides the folder from the sidebar, but notes inside are still built and fully linkable. Use this for notes you want to publish without surfacing them in the navigation.

### Writing in Obsidian

The `src/content/notes/` folder is compatible with Obsidian. You can point an Obsidian vault directly at it and use Obsidian's editor to write, then run `npm run build` to publish. The `[[wikilink]]` syntax is the same.


## Using AI agents

This project is set up for use with [Claude Code](https://claude.ai/code). Run `claude` in the project folder and it will pick up `CLAUDE.md` (project context) and the skill guides in `.claude/skills/` automatically.

### Built-in skills

| Skill file | What it guides the agent to do |
| :--- | :--- |
| `.claude/skills/write-note.md` | Create or rewrite a note, place it in the right topic folder, add wikilinks to and from related notes |
| `.claude/skills/add-wikilinks.md` | Scan all notes and add `[[wikilinks]]` where notes mention each other without linking |
| `.claude/skills/fix-broken-links.md` | Find wikilinks that don't resolve to any note and fix or flag them |
| `.claude/skills/reorganise-notes.md` | Move or rename notes while keeping all wikilinks intact |

### Example prompts for Claude Code

- "Write a note about the Feynman technique and link it to my learning notes"
- "Go through my technology folder and add wikilinks where notes reference each other"
- "Find all broken wikilinks and tell me how to fix them"
- "Move my loose root-level notes into appropriate topic folders"

The `CLAUDE.md` at the project root gives any agent a map of the build pipeline, file structure, and constraints — so you don't have to explain how wikilinks work every time.


## Customising the site

### Site name

Edit `astro.config.mjs` or the site config to change the name shown in the sidebar.

### Colours and fonts

This template uses [Tailwind CSS](https://tailwindcss.com/). Edit `tailwind.config.mjs` to change the colour palette, or edit the component files in `src/components/` and `src/layouts/` directly.


## Contributing

Issues, bug reports, and pull requests are welcome at [github.com/YOUR_USERNAME/astro-stacked-digital-garden](https://github.com/annie-seaward/astro-stacked-digital-garden).

This isn't a full-time maintained project, but reasonable contributions will be reviewed.

---

## Origin & credits

### Inspiration

This project is heavily inspired by [gatsby-digital-garden](https://github.com/mathieudutour/gatsby-digital-garden) by [Mathieu Dutour](https://github.com/mathieudutour). This is an Astro version designed to take advantage of, faster static output with no React runtime on pages that don't need it.


## AI disclaimer

This is a vibe-coded project built with [Claude Code](https://claude.ai/code). It works, I use it as the base template for my own digital garden, but the code is principally AI generated with minimal reviewing — rough edges exist. Issues and pull requests are welcome.


## License

Free to use, modify, and distribute however you like. No strings attached.

If you build something with it and feel like giving a nod back, that's appreciated — but not required.
