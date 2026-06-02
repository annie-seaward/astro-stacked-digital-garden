# Skill: fix-broken-links

Find and fix `[[wikilinks]]` that don't resolve to any note.

## Trigger

User asks to fix broken links, find dead links, or audit wikilinks.

## How broken links work

The build pipeline marks unresolved wikilinks with `.wikilink-broken` (red underline in the UI). They don't break the build — but they're dead ends for readers.

A link breaks when:
- The target note was renamed or deleted
- The link was written with a typo
- The note doesn't exist yet (intentional stub)

## Steps

### 1. Extract all wikilinks

```bash
grep -roh '\[\[[^\]]*\]\]' src/content/notes/ --include="*.md" | sort | uniq
```

### 2. Check slugmap for resolution

Read `src/data/slugmap.json` (regenerate first if stale: `node src/scripts/build-backlinks.mjs`). Any wikilink target not present in the slugmap is broken.

### 3. For each broken link, decide:

- **Typo / rename:** fix the `[[link]]` to match the current note title
- **Note was moved:** update the link to use the new title or path
- **Intentional future note:** leave it — broken links that represent planned notes are fine
- **Genuinely wrong:** remove or reword

### 4. Report what you found

List broken links with their source file and proposed fix. Ask the user to confirm before changing links in bulk — especially deletions.

### 5. Regenerate

```bash
node src/scripts/build-backlinks.mjs
```

Verify the slugmap now contains all previously broken targets.

## Example output format

```
BROKEN LINKS FOUND:

src/content/notes/philosophy/stoicism.md
  [[Epictitus]] → did you mean [[Epictetus]]? (note exists)

src/content/notes/index.md
  [[Getting Started]] → no note found. Create stub or remove?

src/content/notes/technology/language-models.md
  [[Transformers Architecture]] → no note found. Intentional stub?
```
