import type { DevLensConfig } from 'devlens';

export const devlensConfig: DevLensConfig = {
  namespace: 'example-app',

  // Override labels for auto-detected tokens
  tokenOverrides: {
    '--color-primary': {
      label: 'Brand Primary',
      group: 'Brand Colors',
      hint: 'Main brand color used for CTAs and links',
    },
    '--color-primary-foreground': {
      label: 'Brand Primary Text',
      group: 'Brand Colors',
    },
    '--font-size-base': {
      label: 'Body Text',
      group: 'Typography',
      hint: 'Base font size (1rem = 16px)',
    },
  },

  // Example migration map — suggest token replacements for hardcoded values
  migrationMap: {
    'text-gray-900': {
      replacement: 'text-foreground',
      reason: 'Use semantic color token instead of fixed gray',
      confidence: 'high',
    },
    'bg-white': {
      replacement: 'bg-background',
      reason: 'Use semantic surface token for theme support',
      confidence: 'high',
    },
    'text-gray-500': {
      replacement: 'text-muted-foreground',
      reason: 'Use semantic muted text token',
      confidence: 'medium',
    },
  },

  detachedRoute: '/dev/devlens-detached',
};
