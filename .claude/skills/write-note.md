# Skill: write-note

Create or substantially rewrite a note in this digital garden.

## Trigger

User asks to write, create, draft, or add a note / post / page.

## Steps

### 1. Determine location

- Notes live in `src/content/notes/`
- Top-level folders are sidebar topics — place the note in the right topic folder
- If no suitable topic folder exists, ask the user or create one
- Filename: kebab-case of the title, e.g. `the-feynman-technique.md`
- Home page note: `src/content/notes/index.md`

### 2. Check for related notes

Before writing, scan existing notes to find ones that should link to or from the new note:

```bash
ls src/content/notes/
grep -r "[[" src/content/notes/ --include="*.md" -l
```

### 3. Write the note

Frontmatter template (all optional — omit fields you don't need):

```yaml
---
title: "Note Title"
date: YYYY-MM-DD
tags: [tag1, tag2]
---
```

Body: plain Markdown. Use `[[Note Title]]` for internal links. Link generously — connections are the point of a digital garden.

### 4. Add wikilinks to existing notes

If other existing notes should reference the new note, add `[[New Note Title]]` links in those files where relevant.

### 5. Regenerate indexes

The backlinks and slugmap indexes are generated automatically when `npm run dev` runs. Remind the user to restart dev if it's running, or the new note won't appear in wikilink resolution until the prebuild hook fires.

## Example

User: "Write a note about the Zettelkasten method and link it to my note-taking notes"

1. Check `src/content/notes/` for a relevant topic folder (e.g. `productivity/`, `writing/`)
2. Create `src/content/notes/productivity/zettelkasten.md`
3. Search existing notes for ones about note-taking, learning, or PKM — add `[[Zettelkasten]]` links where appropriate
4. Tell user to restart dev server if running
