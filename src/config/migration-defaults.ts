import type { MigrationEntry } from './types';

/**
 * Default migration suggestions: standard Tailwind hardcoded classes
 * to semantic CSS custom property equivalents.
 */
export const DEFAULT_MIGRATION_MAP: Record<string, MigrationEntry> = {
  'text-black': {
    replacement: 'text-foreground',
    reason: 'Use semantic foreground token for theme support',
  },
  'text-white': {
    replacement: 'text-background',
    reason: 'Use semantic background token for theme support',
  },
  'text-gray-900': {
    replacement: 'text-foreground',
    reason: 'Use semantic foreground token',
  },
  'text-gray-500': {
    replacement: 'text-muted-foreground',
    reason: 'Use semantic muted foreground token',
  },
  'bg-white': {
    replacement: 'bg-background',
    reason: 'Use semantic background token for theme support',
  },
  'bg-gray-100': {
    replacement: 'bg-muted',
    reason: 'Use semantic muted token',
  },
  'border-gray-200': {
    replacement: 'border-border',
    reason: 'Use semantic border token',
  },
  'border-gray-300': {
    replacement: 'border-input',
    reason: 'Use semantic input border token',
  },
};
