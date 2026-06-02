# Skill: add-wikilinks

Scan notes and add `[[wikilinks]]` between notes that reference each other but aren't yet linked.

## Trigger

User asks to add links, wire up notes, find missing links, or connect notes.

## Steps

### 1. Build a title map

Read every note's frontmatter title (or derive from filename). Build a list of all note titles and their slugs:

```bash
grep -r "^title:" src/content/notes/ --include="*.md"
ls src/content/notes/**/*.md
```

### 2. Scan for unlinked references

For each note, look for plain-text mentions of other note titles that aren't already wrapped in `[[...]]`. Be conservative — only add a link if the mention is clearly referring to that note.

### 3. Add links

Replace plain-text mentions with `[[Note Title]]`. Preserve existing `[[wikilinks]]` — don't double-wrap.

If the note title is awkward in context, use the pipe syntax: `[[Note Title|natural phrasing]]`.

### 4. Verify nothing is broken

```bash
npm run dev
```

Check the terminal output for any build errors. The prebuild hook will regenerate `slugmap.json` — new links will resolve correctly.

## Rules

- Don't link the same target more than once per note (first occurrence only)
- Don't link inside code blocks or frontmatter

## Example

User: "Go through my technology notes and add wikilinks where notes reference each other"

1. List all note titles in `src/content/notes/technology/`
2. For each note, grep for mentions of other technology note titles
3. Add `[[...]]` around confirmed matches
4. Run `npm run dev` to verify
