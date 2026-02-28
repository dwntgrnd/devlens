/**
 * Class conflict detection for the Element Inspector.
 * Flags competing Tailwind classes that target the same CSS property.
 */

// PENDING: This file is refactored in DL-CC04
import { TEXT_SIZE_KEYWORDS } from './class-categories';

export interface ClassConflict {
  classes: string[];
  property: string;
}

export interface ChipConflictInfo {
  property: string;
  conflictsWith: string[];
}

/**
 * Map class prefix → CSS property group.
 * Classes within the same property group conflict with each other.
 */
const PROPERTY_MAP: [string, string, ((cls: string) => boolean)?][] = [
  // Text color vs text size disambiguation
  ['text-', 'font-size', (cls) => TEXT_SIZE_KEYWORDS.has(cls)],
  ['text-', 'color', (cls) => !TEXT_SIZE_KEYWORDS.has(cls) && !isTextAlignment(cls)],
  ['text-', 'text-align', (cls) => isTextAlignment(cls)],

  // Background
  ['bg-', 'background'],

  // Sizing
  ['w-', 'width'],
  ['h-', 'height'],
  ['min-w-', 'min-width'],
  ['min-h-', 'min-height'],
  ['max-w-', 'max-width'],
  ['max-h-', 'max-height'],

  // Spacing — each direction is its own group
  ['p-', 'padding'],
  ['px-', 'padding-x'],
  ['py-', 'padding-y'],
  ['pt-', 'padding-top'],
  ['pr-', 'padding-right'],
  ['pb-', 'padding-bottom'],
  ['pl-', 'padding-left'],
  ['m-', 'margin'],
  ['mx-', 'margin-x'],
  ['my-', 'margin-y'],
  ['mt-', 'margin-top'],
  ['mr-', 'margin-right'],
  ['mb-', 'margin-bottom'],
  ['ml-', 'margin-left'],

  // Typography
  ['font-', 'font'],
  ['leading-', 'line-height'],
  ['tracking-', 'letter-spacing'],

  // Layout
  ['justify-', 'justify-content'],
  ['items-', 'align-items'],
  ['self-', 'align-self'],
  ['gap-', 'gap'],

  // Borders
  ['rounded-', 'border-radius'],
  ['border-', 'border'],

  // Effects
  ['shadow-', 'box-shadow'],
  ['opacity-', 'opacity'],

  // Display
  ['flex', 'display'],
  ['grid', 'display'],
  ['block', 'display'],
  ['inline', 'display'],
  ['hidden', 'display'],

  // Position
  ['absolute', 'position'],
  ['relative', 'position'],
  ['fixed', 'position'],
  ['sticky', 'position'],

  // Overflow
  ['overflow-', 'overflow'],

  // Z-index
  ['z-', 'z-index'],
];

const TEXT_ALIGN_KEYWORDS = new Set([
  'text-left', 'text-center', 'text-right', 'text-justify', 'text-start', 'text-end',
]);

function isTextAlignment(cls: string): boolean {
  return TEXT_ALIGN_KEYWORDS.has(cls);
}

/**
 * Extract variant prefix from a class, e.g. "hover:bg-red-500" → "hover:"
 * Returns empty string for base classes.
 */
function getVariantPrefix(cls: string): string {
  const lastColon = cls.lastIndexOf(':');
  if (lastColon === -1) return '';
  // Check if it's actually a variant (not just part of the class name)
  const prefix = cls.slice(0, lastColon + 1);
  // Common variant prefixes
  if (/^(hover|focus|active|disabled|group-|peer-|first|last|odd|even|focus-within|focus-visible|aria-|data-|sm|md|lg|xl|2xl|dark|print):/.test(prefix)) {
    return prefix;
  }
  return '';
}

/**
 * Get the base class (strip variant prefix).
 */
function getBaseClass(cls: string): string {
  const prefix = getVariantPrefix(cls);
  return prefix ? cls.slice(prefix.length) : cls;
}

/**
 * Get the CSS property group for a class.
 */
function getPropertyGroup(cls: string): string | null {
  const base = getBaseClass(cls);

  for (const [prefix, property, filter] of PROPERTY_MAP) {
    if (base === prefix || base.startsWith(prefix)) {
      if (filter && !filter(base)) continue;
      return property;
    }
  }
  return null;
}

/**
 * Detect conflicting classes — classes that target the same CSS property
 * within the same variant group.
 */
export function detectConflicts(classes: string[]): ClassConflict[] {
  // Group classes by (variant + property)
  const groups = new Map<string, string[]>();

  for (const cls of classes) {
    const property = getPropertyGroup(cls);
    if (!property) continue;

    const variant = getVariantPrefix(cls);
    const key = `${variant}|${property}`;

    const existing = groups.get(key);
    if (existing) {
      existing.push(cls);
    } else {
      groups.set(key, [cls]);
    }
  }

  // Only groups with 2+ classes are conflicts
  const conflicts: ClassConflict[] = [];
  for (const [key, group] of groups) {
    if (group.length >= 2) {
      const property = key.split('|')[1];
      conflicts.push({ classes: group, property });
    }
  }

  return conflicts;
}

/**
 * Get conflict info for a specific class chip.
 */
export function getChipConflicts(
  cls: string,
  conflicts: ClassConflict[]
): ChipConflictInfo | undefined {
  for (const conflict of conflicts) {
    if (conflict.classes.includes(cls)) {
      const others = conflict.classes.filter((c) => c !== cls);
      return { property: conflict.property, conflictsWith: others };
    }
  }
  return undefined;
}
