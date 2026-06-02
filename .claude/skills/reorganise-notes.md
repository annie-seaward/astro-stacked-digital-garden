# Skill: reorganise-notes

Move notes between topic folders, rename notes, and keep all wikilinks intact.

## Trigger

User asks to reorganise, restructure, rename, or move notes.

## Critical: wikilinks break on rename

`[[wikilinks]]` resolve by note title (frontmatter `title:` field) or filename, via `slugmap.json`. Renaming a file without updating the title — or changing a title without updating links — creates broken links.

## Steps

### 1. Plan before touching files

List the proposed moves. For each note being renamed or moved:
- Find all notes that link to it: `grep -r "[[Old Title]]" src/content/notes/ --include="*.md"`
- Record which files need their wikilinks updated

### 2. Move files

Use `mv` to move files to their new location. Keep filenames consistent with note titles (kebab-case).

### 3. Update frontmatter titles

If renaming: update the `title:` field in the moved note's frontmatter to match the new name.

### 4. Add aliases for backward compat (optional)

If other sites or notes link to the old title, add it as an alias rather than removing it:

```yaml
aliases: ["Old Title"]
```

This lets both `[[Old Title]]` and `[[New Title]]` resolve correctly.

### 5. Update wikilinks in referencing notes

Replace `[[Old Title]]` with `[[New Title]]` in every file identified in step 1.

### 6. Regenerate and verify

```bash
node src/scripts/build-backlinks.mjs
npm run dev
```

Check the dev server output for errors. Browse to affected notes and confirm links resolve (no red underlines).

### 7. Update sidebar (if restructuring topics)

Sidebar topics come from top-level folder names — renaming a folder changes the sidebar label automatically. No extra config needed.

## Example

User: "Move my loose root-level notes into topic folders"

1. List all `.md` files directly in `src/content/notes/` (not in subfolders)
2. For each, suggest a topic folder based on content
3. Confirm with user before moving
4. Move files, find all wikilinks to them, update links
5. Regenerate, verify
