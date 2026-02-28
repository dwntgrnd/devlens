/**
 * Class categorization utilities for the Element Inspector.
 * Groups Tailwind/utility classes into semantic categories for display.
 *
 * Config-driven: callers pass project-specific text-size classes
 * rather than relying on a hardcoded set.
 */

/** Built-in Tailwind text-size class suffixes (text-xs through text-9xl) */
export const TEXT_SIZE_KEYWORDS = new Set([
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',
  'text-6xl',
  'text-7xl',
  'text-8xl',
  'text-9xl',
]);

const TEXT_ALIGN_KEYWORDS = new Set([
  'text-left',
  'text-center',
  'text-right',
  'text-justify',
  'text-start',
  'text-end',
]);

const TEXT_DECORATION_KEYWORDS = new Set([
  'underline',
  'overline',
  'line-through',
  'no-underline',
]);

const TEXT_TRANSFORM_KEYWORDS = new Set([
  'uppercase',
  'lowercase',
  'capitalize',
  'normal-case',
]);

const TEXT_OVERFLOW_KEYWORDS = new Set([
  'truncate',
  'text-ellipsis',
  'text-clip',
]);

const TEXT_WRAP_KEYWORDS = new Set([
  'text-wrap',
  'text-nowrap',
  'text-balance',
  'text-pretty',
]);

export interface CategoryGroup {
  category: string;
  classes: string[];
}

/**
 * Check if a class is a text-size class (built-in or project-specific).
 */
function isTextSize(cls: string, projectTextSizeClasses?: Set<string>): boolean {
  if (TEXT_SIZE_KEYWORDS.has(cls)) return true;
  if (projectTextSizeClasses?.has(cls)) return true;
  return false;
}

/**
 * Categorize a single class into a semantic group.
 */
export function categorizeClass(
  cls: string,
  projectTextSizeClasses?: Set<string>,
): string {
  // Strip variant prefix for categorization (e.g. "hover:bg-red-500" → "bg-red-500")
  const colonIdx = cls.lastIndexOf(':');
  const base = colonIdx > 0 ? cls.slice(colonIdx + 1) : cls;

  // Layout
  if (
    base === 'flex' || base === 'grid' || base === 'block' || base === 'inline' ||
    base === 'inline-flex' || base === 'inline-grid' || base === 'inline-block' ||
    base === 'hidden' || base === 'contents' ||
    base === 'absolute' || base === 'relative' || base === 'fixed' || base === 'sticky' || base === 'static' ||
    base.startsWith('flex-') || base.startsWith('grid-') ||
    base.startsWith('col-') || base.startsWith('row-') ||
    base.startsWith('justify-') || base.startsWith('items-') || base.startsWith('self-') ||
    base.startsWith('place-') || base.startsWith('order-') ||
    base.startsWith('float-') || base === 'clear-both' || base.startsWith('clear-') ||
    base.startsWith('top-') || base.startsWith('right-') ||
    base.startsWith('bottom-') || base.startsWith('left-') ||
    base.startsWith('inset-') ||
    base.startsWith('z-') || base.startsWith('overflow-')
  ) {
    return 'Layout';
  }

  // Sizing
  if (
    base.startsWith('w-') || base.startsWith('h-') ||
    base.startsWith('min-w-') || base.startsWith('min-h-') ||
    base.startsWith('max-w-') || base.startsWith('max-h-') ||
    base.startsWith('size-') ||
    base.startsWith('aspect-')
  ) {
    return 'Sizing';
  }

  // Spacing
  if (
    base.startsWith('p-') || base.startsWith('px-') || base.startsWith('py-') ||
    base.startsWith('pt-') || base.startsWith('pr-') ||
    base.startsWith('pb-') || base.startsWith('pl-') ||
    base.startsWith('ps-') || base.startsWith('pe-') ||
    base.startsWith('m-') || base.startsWith('mx-') || base.startsWith('my-') ||
    base.startsWith('mt-') || base.startsWith('mr-') ||
    base.startsWith('mb-') || base.startsWith('ml-') ||
    base.startsWith('ms-') || base.startsWith('me-') ||
    base.startsWith('gap-') || base.startsWith('space-')
  ) {
    return 'Spacing';
  }

  // Typography — font-size (text-size classes), font-*, leading-*, tracking-*, etc.
  if (
    isTextSize(base, projectTextSizeClasses) ||
    base.startsWith('font-') || base.startsWith('leading-') || base.startsWith('tracking-') ||
    TEXT_ALIGN_KEYWORDS.has(base) ||
    TEXT_DECORATION_KEYWORDS.has(base) ||
    TEXT_TRANSFORM_KEYWORDS.has(base) ||
    TEXT_OVERFLOW_KEYWORDS.has(base) ||
    TEXT_WRAP_KEYWORDS.has(base) ||
    base.startsWith('indent-') ||
    base.startsWith('align-') || base.startsWith('whitespace-') ||
    base.startsWith('break-') || base === 'antialiased' || base === 'subpixel-antialiased' ||
    base.startsWith('decoration-') || base.startsWith('underline-offset-') ||
    base.startsWith('list-')
  ) {
    return 'Typography';
  }

  // Colors — text-* (non-size, non-align), bg-*, border-color patterns
  if (
    (base.startsWith('text-') && !isTextSize(base, projectTextSizeClasses) &&
     !TEXT_ALIGN_KEYWORDS.has(base) && !TEXT_OVERFLOW_KEYWORDS.has(base) &&
     !TEXT_WRAP_KEYWORDS.has(base)) ||
    (base.startsWith('bg-') && !base.startsWith('bg-gradient-')) ||
    base.startsWith('from-') || base.startsWith('via-') || base.startsWith('to-') ||
    base.startsWith('bg-gradient-') ||
    base.startsWith('accent-') || base.startsWith('caret-') ||
    base.startsWith('fill-') || base.startsWith('stroke-')
  ) {
    return 'Colors';
  }

  // Borders & Rings
  if (
    base.startsWith('border') || base.startsWith('rounded') ||
    base.startsWith('divide-') ||
    base.startsWith('ring-') || base === 'ring' ||
    base.startsWith('outline-') || base === 'outline' || base === 'outline-none'
  ) {
    return 'Borders';
  }

  // Effects
  if (
    base.startsWith('shadow') || base.startsWith('opacity-') ||
    base.startsWith('blur-') || base === 'blur' ||
    base.startsWith('brightness-') || base.startsWith('contrast-') ||
    base.startsWith('grayscale') || base.startsWith('hue-rotate-') ||
    base.startsWith('invert') || base.startsWith('saturate-') || base.startsWith('sepia') ||
    base.startsWith('drop-shadow-') ||
    base.startsWith('backdrop-') ||
    base.startsWith('mix-blend-') || base.startsWith('bg-blend-') ||
    base.startsWith('transition') || base.startsWith('duration-') ||
    base.startsWith('ease-') || base.startsWith('delay-') ||
    base.startsWith('animate-') ||
    base.startsWith('scale-') || base.startsWith('rotate-') ||
    base.startsWith('translate-') || base.startsWith('skew-') ||
    base === 'transform' || base === 'transform-gpu' || base === 'transform-none'
  ) {
    return 'Effects';
  }

  return 'Other';
}

/**
 * Find classes that set font size (built-in Tailwind text-size + project-specific).
 */
export function findFontSizeClasses(
  classes: string[],
  projectTextSizeClasses?: Set<string>,
): string[] {
  return classes.filter((cls) => isTextSize(cls, projectTextSizeClasses));
}

/**
 * Group classes into categories for display in the inspector.
 * Returns groups in a stable order (Layout → Sizing → Spacing → Typography → Colors → Borders → Effects → Other).
 */
export function categorizeClasses(
  classes: string[],
  projectTextSizeClasses?: Set<string>,
): CategoryGroup[] {
  const CATEGORY_ORDER = ['Layout', 'Sizing', 'Spacing', 'Typography', 'Colors', 'Borders', 'Effects', 'Other'];
  const map = new Map<string, string[]>();

  for (const cls of classes) {
    const category = categorizeClass(cls, projectTextSizeClasses);
    const existing = map.get(category);
    if (existing) {
      existing.push(cls);
    } else {
      map.set(category, [cls]);
    }
  }

  const groups: CategoryGroup[] = [];
  for (const cat of CATEGORY_ORDER) {
    const items = map.get(cat);
    if (items && items.length > 0) {
      groups.push({ category: cat, classes: items });
    }
  }

  return groups;
}
