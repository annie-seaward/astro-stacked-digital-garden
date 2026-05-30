import backlinksData from '../data/backlinks.json';

export interface Backlink {
  slug: string;
  title: string;
}

export function getBacklinks(slug: string): Backlink[] {
  return (backlinksData as Record<string, Backlink[]>)[slug] ?? [];
}
