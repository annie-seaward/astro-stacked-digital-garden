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

  for (const entry of entries) {
    const id = entry.id; // e.g. "philosophy/stoicism" or "philosophy/index"
    const parts = id.split('/');
    if (parts.length < 2) continue;
    const folder = parts[0];
    if (folder.startsWith('_')) continue;
    topFolders.add(folder);

    const last = parts[parts.length - 1];
    if (last === 'index') {
      folderHasIndex[folder] = true;
      folderFirstFile[folder] = id; // e.g. "philosophy/index"
    } else if (!folderHasIndex[folder] && !folderFirstFile[folder]) {
      folderFirstFile[folder] = id;
    }
  }

  const topics: Topic[] = [];
  for (const folder of [...topFolders].sort()) {
    const label = folder.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const slug = folderHasIndex[folder] ? folder : (folderFirstFile[folder] || folder);
    topics.push({ label, slug });
  }
  return topics;
}
