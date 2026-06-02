import { visit } from 'unist-util-visit';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

export default function remarkWikilinks({ slugmap = {} } = {}) {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || !node.value.includes('[[')) return;

      const regex = /\[\[([^\]]+)\]\]/g;
      if (!regex.test(node.value)) return;
      regex.lastIndex = 0;

      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            value: node.value.slice(lastIndex, match.index),
          });
        }
        const inner = match[1];
        const pipeIdx = inner.indexOf('|');
        const target = pipeIdx === -1 ? inner : inner.slice(0, pipeIdx);
        const label =
          pipeIdx === -1 ? target.trim() : inner.slice(pipeIdx + 1).trim();
        const simpleSlug = slugify(target);
        // Resolve to full slug (e.g. "stoicism" → "philosophy/stoicism")
        const fullSlug =
          slugmap[simpleSlug] || slugmap[target.trim()] || simpleSlug;
        const isBroken = fullSlug === simpleSlug && !slugmap[simpleSlug];
        parts.push({
          type: 'html',
          value: `<a href="/notes/${fullSlug}" data-slug="${fullSlug}" class="wikilink${isBroken ? ' wikilink-broken' : ''}">${label}</a>`,
        });
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      if (parts.length > 0) {
        parent.children.splice(index, 1, ...parts);
        return index + parts.length;
      }
    });
  };
}
