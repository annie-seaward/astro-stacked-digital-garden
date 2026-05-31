import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

interface Props {
  readonly key?: string;
  readonly slug: string;
  readonly html: string;
  readonly title: string;
  readonly isObstructed: boolean;
  readonly isObstructedRight: boolean;
  readonly isHighlighted: boolean;
  readonly isNew: boolean;
  readonly isMobile: boolean;
  readonly fullWidthOverride?: number;
  readonly panelRef?: (el: HTMLDivElement | null) => void;
  readonly onObstructedClick: () => void;
  readonly onLinkClick: (slug: string) => void;
}

const FULL_WIDTH = 520;
const OBSTRUCTED_WIDTH = 48;

export function NotePanel({ html, title, isObstructed, isObstructedRight, isHighlighted, isNew, isMobile, fullWidthOverride, panelRef, onObstructedClick, onLinkClick }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Slide-in: fires once on mount when panel is new
  useEffect(() => {
    if (!isNew || !wrapperRef.current) return;
    const el = wrapperRef.current;
    el.classList.add('panel-entering');
    el.addEventListener('animationend', () => el.classList.remove('panel-entering'), { once: true });
  }, []); // intentionally empty — fires once on mount only

  // Wikilink click interception
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || isObstructed) return;

    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[data-slug]');
      if (!target) return;
      e.preventDefault();
      const targetSlug = (target as HTMLElement).dataset.slug;
      if (targetSlug) onLinkClick(targetSlug);
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [isObstructed, onLinkClick]);

  // Scroll to top when content changes (new note loaded into panel)
  const scrollableRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollableRef.current) return;
    scrollableRef.current.scrollTop = 0;
  }, [html]);

  // Scroll to top when panel is highlighted
  useEffect(() => {
    if (!isHighlighted || !scrollableRef.current) return;
    scrollableRef.current.scrollTop = 0;
  }, [isHighlighted]);

  // Scroll to top when panel transitions from obstructed to visible
  useEffect(() => {
    if (isObstructed || !scrollableRef.current) return;
    scrollableRef.current.scrollTop = 0;
  }, [isObstructed]);

  const fullWidth = fullWidthOverride ?? (isMobile ? globalThis.innerWidth : Math.min(FULL_WIDTH, Math.floor(globalThis.innerWidth * 0.9)));
  const targetWidth = isObstructed ? OBSTRUCTED_WIDTH : fullWidth;

  const borderClass = isObstructedRight
    ? 'border-l border-gray-200 dark:border-gray-700'
    : 'border-r border-gray-200 dark:border-gray-700';

  const bgClass = isObstructed
    ? 'bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
    : 'bg-white dark:bg-gray-950';

  const innerClass = isHighlighted ? ' note-panel panel-highlight' : ' note-panel';

  return (
    <div
      ref={(el: HTMLDivElement | null) => {
        (wrapperRef as { current: HTMLDivElement | null }).current = el;
        panelRef?.(el);
      }}
      class={`panel-wrapper ${borderClass} ${bgClass}`}
      style={{ width: `${targetWidth}px` }}
      aria-label={title}
    >
      {isObstructed ? (
        <button
          class="h-full w-full flex items-center justify-center bg-transparent border-0 p-0 cursor-pointer"
          onClick={onObstructedClick}
          aria-label={title}
        >
          <span class="rotate-90 text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap select-none">
            {title}
          </span>
        </button>
      ) : (
        <div ref={scrollableRef} class={`h-full overflow-y-auto${innerClass}`}>
          <div class="p-8 max-w-prose">
            <div
              class="prose dark:prose-invert prose-sm sm:prose-base prose-a:text-green-700 dark:prose-a:text-green-400"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
