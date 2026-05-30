import { h } from 'preact';
import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import { NotePanel } from './NotePanel';

interface NoteData {
  slug: string;
  title: string;
  html: string;
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

function readPrimaryFromDOM(): NoteData {
  const wrapper = document.querySelector('[data-primary-slug]');
  const slug = wrapper?.getAttribute('data-primary-slug') || '';
  const title = wrapper?.getAttribute('data-primary-title') || slug;
  const html = document.getElementById('note-content')?.innerHTML || '';
  return { slug, title, html };
}

export function StackedGarden() {
  const [currentPrimary, setCurrentPrimary] = useState<NoteData>(() => {
    const data = readPrimaryFromDOM();
    cache.set(data.slug, data);
    return data;
  });

  const getInitialStack = (): string[] => {
    const params = new URLSearchParams(window.location.search);
    const stackParam = params.get('stack');
    return stackParam ? stackParam.split(',').filter(Boolean) : [];
  };

  const [stackSlugs, setStackSlugs] = useState<string[]>(getInitialStack);
  const [panels, setPanels] = useState<NoteData[]>([currentPrimary]);
  const [highlightSlug, setHighlightSlug] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // On sidebar navigation (astro:after-swap), update primary panel
  useEffect(() => {
    const handleSwap = () => {
      const data = readPrimaryFromDOM();
      cache.set(data.slug, data);
      setCurrentPrimary(data);
      setStackSlugs([]);
    };
    document.addEventListener('astro:after-swap', handleSwap);
    return () => document.removeEventListener('astro:after-swap', handleSwap);
  }, []);

  // Rebuild panels when stackSlugs or currentPrimary changes
  useEffect(() => {
    let cancelled = false;
    async function buildPanels() {
      const loaded: NoteData[] = [currentPrimary];
      for (const slug of stackSlugs) {
        const note = await fetchNote(slug);
        if (cancelled) return;
        if (note) loaded.push(note);
      }
      if (!cancelled) setPanels(loaded);
    }
    buildPanels();
    return () => { cancelled = true; };
  }, [stackSlugs, currentPrimary]);

  // Sync URL when stack changes
  useEffect(() => {
    const url = new URL(globalThis.location.href);
    if (stackSlugs.length === 0) {
      url.searchParams.delete('stack');
    } else {
      url.searchParams.set('stack', stackSlugs.join(','));
    }
    globalThis.history.pushState({}, '', url.toString());
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

  const focusNote = useCallback((slug: string) => {
    // Slug already in stack — collapse panels to its right, highlight it
    if (slug === currentPrimary.slug) {
      setStackSlugs([]);
    } else {
      setStackSlugs(prev => {
        const idx = prev.indexOf(slug);
        return idx === -1 ? prev : prev.slice(0, idx + 1);
      });
    }
    setHighlightSlug(slug);
    setTimeout(() => {
      const panel = panelRefs.current.get(slug);
      panel?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }, 50);
    setTimeout(() => setHighlightSlug(null), 1300);
  }, [currentPrimary.slug]);

  const openNote = useCallback((slug: string) => {
    if (slug === currentPrimary.slug || stackSlugs.includes(slug)) {
      focusNote(slug);
      return;
    }
    setStackSlugs(prev => [...prev, slug]);
    setTimeout(() => {
      containerRef.current?.scrollTo({ left: containerRef.current.scrollWidth, behavior: 'smooth' });
    }, 100);
  }, [currentPrimary.slug, stackSlugs, focusNote]);

  const bringToFront = useCallback((slug: string) => {
    if (slug === currentPrimary.slug) {
      setStackSlugs([]);
      return;
    }
    setStackSlugs(prev => {
      const idx = prev.indexOf(slug);
      if (idx === -1) return prev;
      return prev.slice(0, idx + 1);
    });
  }, [currentPrimary.slug]);

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
            isHighlighted={highlightSlug === note.slug}
            panelRef={(el) => {
              if (el) panelRefs.current.set(note.slug, el);
              else panelRefs.current.delete(note.slug);
            }}
            onObstructedClick={() => bringToFront(note.slug)}
            onLinkClick={openNote}
          />
        );
      })}
    </div>
  );
}
