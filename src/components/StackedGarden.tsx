import { h } from 'preact';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { NotePanel } from './NotePanel';

interface NoteData {
  slug: string;
  title: string;
  html: string;
}

interface Props {
  primary: { slug: string; title: string };
}

const cache = new Map<string, NoteData>();

async function fetchNote(slug: string): Promise<NoteData | null> {
  if (cache.has(slug)) return cache.get(slug)!;
  try {
    const res = await fetch(`/notes/${slug}`);
    if (!res.ok) return null;
    const htmlText = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const content = doc.getElementById('note-content');
    const titleEl = doc.querySelector('h1');
    const noteTitle = titleEl?.textContent?.trim() || slug.split('/').pop() || slug;
    const noteHtml = content?.innerHTML || '';
    const data: NoteData = { slug, title: noteTitle, html: noteHtml };
    cache.set(slug, data);
    return data;
  } catch {
    return null;
  }
}

export function StackedGarden({ primary }: Props) {
  const [primaryHtml] = useState(() => {
    const html = document.getElementById('note-content')?.innerHTML || '';
    cache.set(primary.slug, { slug: primary.slug, title: primary.title, html });
    return html;
  });

  const getInitialStack = (): string[] => {
    if (typeof window === 'undefined') return [];
    const params = new URLSearchParams(window.location.search);
    const stackParam = params.get('stack');
    return stackParam ? stackParam.split(',').filter(Boolean) : [];
  };

  const [stackSlugs, setStackSlugs] = useState<string[]>(getInitialStack);
  const [panels, setPanels] = useState<NoteData[]>([
    { slug: primary.slug, title: primary.title, html: primaryHtml },
  ]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Rebuild panels when stackSlugs or primaryHtml changes
  useEffect(() => {
    let cancelled = false;
    async function buildPanels() {
      const primaryData: NoteData = { slug: primary.slug, title: primary.title, html: primaryHtml };
      const loaded: NoteData[] = [primaryData];
      for (const slug of stackSlugs) {
        const note = await fetchNote(slug);
        if (cancelled) return;
        if (note) loaded.push(note);
      }
      if (!cancelled) setPanels(loaded);
    }
    buildPanels();
    return () => { cancelled = true; };
  }, [stackSlugs, primaryHtml]);

  // Sync URL when stack changes
  useEffect(() => {
    const url = new URL(window.location.href);
    if (stackSlugs.length === 0) {
      url.searchParams.delete('stack');
    } else {
      url.searchParams.set('stack', stackSlugs.join(','));
    }
    window.history.pushState({}, '', url.toString());
  }, [stackSlugs]);

  // Handle browser back/forward
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const stackParam = params.get('stack');
      setStackSlugs(stackParam ? stackParam.split(',').filter(Boolean) : []);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const openNote = useCallback((slug: string) => {
    setStackSlugs(prev => {
      if (prev.includes(slug) || slug === primary.slug) return prev;
      return [...prev, slug];
    });
    setTimeout(() => {
      containerRef.current?.scrollTo({ left: containerRef.current.scrollWidth, behavior: 'smooth' });
    }, 100);
  }, [primary.slug]);

  const bringToFront = useCallback((slug: string) => {
    if (slug === primary.slug) {
      setStackSlugs([]);
      return;
    }
    setStackSlugs(prev => {
      const idx = prev.indexOf(slug);
      if (idx === -1) return prev;
      return prev.slice(0, idx + 1);
    });
  }, [primary.slug]);

  const [visibleCount, setVisibleCount] = useState(999);
  useEffect(() => {
    const calc = () => {
      const sidebarWidth = 240;
      const panelWidth = 520;
      const available = window.innerWidth - sidebarWidth;
      setVisibleCount(Math.max(1, Math.floor(available / panelWidth)));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  if (panels.length === 0) {
    return (
      <div class="flex h-full items-center justify-center text-gray-400 dark:text-gray-600">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} class="flex h-full overflow-x-auto overflow-y-hidden scroll-smooth">
      {panels.map((note, i) => {
        const isObstructed = i < panels.length - visibleCount;
        return (
          <NotePanel
            key={note.slug}
            slug={note.slug}
            title={note.title}
            html={note.html}
            isObstructed={isObstructed}
            onObstructedClick={() => bringToFront(note.slug)}
            onLinkClick={openNote}
          />
        );
      })}
    </div>
  );
}
