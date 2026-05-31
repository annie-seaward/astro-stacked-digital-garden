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

function readPrimaryFromDOM(doc: Document = document): NoteData {
  const wrapper = doc.querySelector('[data-primary-slug]');
  const slug = wrapper?.getAttribute('data-primary-slug') || '';
  const title = wrapper?.getAttribute('data-primary-title') || slug;
  const html = doc.getElementById('note-content')?.innerHTML || '';
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
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const seenSlugsRef = useRef<Set<string>>(new Set<string>());

  // Seed seen set with initial primary (never slides in)
  useEffect(() => {
    seenSlugsRef.current.add(currentPrimary.slug);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // On sidebar navigation, capture new primary data before swap (while newDocument is available),
  // then apply it after swap. transition:persist keeps the old element in the DOM with stale
  // attributes, so we must read from newDocument rather than the live DOM after swap.
  useEffect(() => {
    let pendingData: NoteData | null = null;

    const handleBeforeSwap = (e: Event) => {
      const newDoc = (e as CustomEvent & { newDocument: Document }).newDocument;
      if (newDoc) pendingData = readPrimaryFromDOM(newDoc);
    };

    const handleAfterSwap = () => {
      const data = pendingData ?? readPrimaryFromDOM();
      pendingData = null;
      cache.set(data.slug, data);
      seenSlugsRef.current = new Set([data.slug]);
      setCurrentPrimary(data);
      setStackSlugs([]);
      requestAnimationFrame(() => {
        const el = panelRefs.current.get(data.slug);
        if (el) {
          const scrollable = el.querySelector('.note-panel');
          if (scrollable) (scrollable as HTMLElement).scrollTop = 0;
        }
      });
    };

    document.addEventListener('astro:before-swap', handleBeforeSwap);
    document.addEventListener('astro:after-swap', handleAfterSwap);
    return () => {
      document.removeEventListener('astro:before-swap', handleBeforeSwap);
      document.removeEventListener('astro:after-swap', handleAfterSwap);
    };
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

  // Mark all rendered panels as seen after each render
  useEffect(() => {
    panels.forEach(p => seenSlugsRef.current.add(p.slug));
  }, [panels]);

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
    const idx = slug === currentPrimary.slug ? 0 : stackSlugs.indexOf(slug) + 1;
    setFocusedIndex(idx);
    setHighlightSlug(slug);
    setTimeout(() => {
      panelRefs.current.get(slug)?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }, 50);
    setTimeout(() => setHighlightSlug(null), 1300);
  }, [currentPrimary.slug, stackSlugs]);

  const openNote = useCallback((slug: string) => {
    if (slug === currentPrimary.slug || stackSlugs.includes(slug)) {
      focusNote(slug);
      return;
    }
    const newIndex = panels.length;
    setStackSlugs(prev => [...prev, slug]);
    setFocusedIndex(newIndex);
    requestAnimationFrame(() => {
      containerRef.current?.scrollTo({ left: containerRef.current.scrollWidth, behavior: 'smooth' });
    });
  }, [currentPrimary.slug, stackSlugs, focusNote, panels.length]);

  const bringToFront = useCallback((slug: string) => {
    const idx = slug === currentPrimary.slug ? 0 : stackSlugs.indexOf(slug) + 1;
    setFocusedIndex(idx);
  }, [currentPrimary.slug, stackSlugs]);

  const calcLayout = () => {
    const mobile = window.innerWidth < 768;
    if (mobile) return { isMobile: true, isSinglePage: true, visibleCount: 1 };
    const sidebarPermanent = window.innerWidth >= 1024;
    const sidebarWidth = sidebarPermanent ? 240 : 0;
    const panelWidth = 520;
    const count = Math.max(1, Math.floor((window.innerWidth - sidebarWidth) / panelWidth));
    return { isMobile: false, isSinglePage: count < 2, visibleCount: count, sidebarPermanent };
  };
  const [layout, setLayout] = useState(calcLayout);
  const { visibleCount, isMobile, isSinglePage, sidebarPermanent } = layout;
  useEffect(() => {
    const onResize = () => setLayout(calcLayout());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
      {(() => {
        const clampedFocus = Math.min(focusedIndex, panels.length - 1);
        // Show as many panels as fit; keep focus visible; fill right first, then left
        const rightEdge = Math.min(panels.length - 1, clampedFocus + (visibleCount - 1));
        const leftEdge = Math.max(0, rightEdge - (visibleCount - 1));
        const obstructedCount = isSinglePage && !isMobile ? panels.length - 1 : 0;
        const sidebarOffset = sidebarPermanent ? 240 : 0;
        const activePanelWidth = (isSinglePage && !isMobile)
          ? window.innerWidth - sidebarOffset - obstructedCount * 48
          : undefined;
        return panels.map((note, i) => {
          const isObstructedLeft = i < leftEdge;
          const isObstructedRight = i > rightEdge;
          const isObstructed = isObstructedLeft || isObstructedRight;
          if (isMobile && isObstructed) return null;
          const isNew = !seenSlugsRef.current.has(note.slug);
          const fullWidthOverride = (isSinglePage && !isMobile && !isObstructed) ? activePanelWidth : undefined;
          return (
            <NotePanel
              key={note.slug}
              slug={note.slug}
              title={note.title}
              html={note.html}
              isObstructed={isObstructed}
              isObstructedRight={isObstructedRight}
              isHighlighted={highlightSlug === note.slug}
              isNew={isNew}
              isMobile={isMobile}
              fullWidthOverride={fullWidthOverride}
              panelRef={(el) => {
                if (el) panelRefs.current.set(note.slug, el);
                else panelRefs.current.delete(note.slug);
              }}
              onObstructedClick={() => bringToFront(note.slug)}
              onLinkClick={openNote}
            />
          );
        });
      })()}
    </div>
  );
}
