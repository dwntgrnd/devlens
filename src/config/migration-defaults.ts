import type { MigrationEntry } from './types';

/**
 * Default migration suggestions: standard Tailwind hardcoded classes
 * to semantic CSS custom property equivalents.
 */
export const DEFAULT_MIGRATION_MAP: Record<string, MigrationEntry> = {
  'text-black': {
    replacement: 'text-foreground',
    reason: 'Use semantic foreground token for theme support',
    confidence: 'high',
  },
  'text-white': {
    replacement: 'text-background',
    reason: 'Use semantic background token for theme support',
    confidence: 'high',
  },
  'text-gray-900': {
    replacement: 'text-foreground',
    reason: 'Use semantic foreground token',
    confidence: 'high',
  },
  'text-gray-500': {
    replacement: 'text-muted-foreground',
    reason: 'Use semantic muted foreground token',
    confidence: 'high',
  },
  'bg-white': {
    replacement: 'bg-background',
    reason: 'Use semantic background token for theme support',
    confidence: 'high',
  },
  'bg-gray-100': {
    replacement: 'bg-muted',
    reason: 'Use semantic muted token',
    confidence: 'medium',
  },
  'border-gray-200': {
    replacement: 'border-border',
    reason: 'Use semantic border token',
    confidence: 'high',
  },
  'border-gray-300': {
    replacement: 'border-input',
    reason: 'Use semantic input border token',
    confidence: 'medium',
  },
};
