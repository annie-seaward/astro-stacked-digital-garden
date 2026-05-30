import { getCollection } from 'astro:content';

export interface Topic {
  label: string;
  slug: string;
}

export async function getTopics(): Promise<Topic[]> {
  const entries = await getCollection('notes');

  const topFolders = new Set<string>();
  const folderFirstFile: Record<string, string> = {};
  const folderHasIndex: Record<string, boolean> = {};

  // First pass: collect all folders that have child notes
  const foldersWithChildren = new Set<string>();
  for (const entry of entries) {
    const parts = entry.id.split('/');
    if (parts.length >= 2) foldersWithChildren.add(parts[0]);
  }

  for (const entry of entries) {
    const id = entry.id;
    const parts = id.split('/');
    const folder = parts[0];
    if (folder.startsWith('_')) continue;
    if (!foldersWithChildren.has(folder)) continue;

    topFolders.add(folder);

    // Astro glob loader gives philosophy/index.md the id "philosophy" (no slash)
    if (parts.length === 1) {
      folderHasIndex[folder] = true;
      folderFirstFile[folder] = id;
    } else if (!folderHasIndex[folder] && !folderFirstFile[folder]) {
      folderFirstFile[folder] = id;
    }
  }

  const topics: Topic[] = [];
  for (const folder of [...topFolders].sort()) {
    const label = folder.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const slug = folderFirstFile[folder] || folder;
    topics.push({ label, slug });
  }
  return topics;
}
