import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

interface Props {
  slug: string;
  html: string;
  title: string;
  isObstructed: boolean;
  isHighlighted: boolean;
  panelRef?: (el: HTMLDivElement | null) => void;
  onObstructedClick: () => void;
  onLinkClick: (slug: string) => void;
}

export function NotePanel({ slug, html, title, isObstructed, isHighlighted, panelRef, onObstructedClick, onLinkClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || isObstructed) return;

    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[data-slug]');
      if (!target) return;
      e.preventDefault();
      const targetSlug = target.getAttribute('data-slug');
      if (targetSlug) onLinkClick(targetSlug);
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [isObstructed, onLinkClick]);

  useEffect(() => {
    if (!isHighlighted || !ref.current) return;
    ref.current.scrollTop = 0;
  }, [isHighlighted]);

  if (isObstructed) {
    return (
      <div
        class="obstructed-panel flex-shrink-0 w-12 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
        onClick={onObstructedClick}
        aria-label={title}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onObstructedClick()}
      >
        <span class="rotate-90 text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap select-none">{title}</span>
      </div>
    );
  }

  return (
    <div
      ref={(el) => {
        (ref as { current: HTMLDivElement | null }).current = el;
        panelRef?.(el);
      }}
      class={`note-panel flex-shrink-0 w-[520px] max-w-[90vw] h-full overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950${isHighlighted ? ' panel-highlight' : ''}`}
      aria-label={title}
    >
      <div class="p-8 max-w-prose">
        <div
          class="prose dark:prose-invert prose-sm sm:prose-base prose-a:text-green-700 dark:prose-a:text-green-400"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
