/**
 * Runtime auto-detection of CSS custom properties from :root.
 * Discovers all --vars, infers type/group/label, returns a map
 * that can be merged with manual overrides in token-registry.ts.
 */

import type { TokenType } from '../config/types';

export interface AutoDetectedToken {
  label: string;
  group: string;
  type: TokenType;
  value: string;
}

/** Prefixes to exclude from auto-detection */
const EXCLUDED_PREFIXES = [
  '--tw-',
  '--next-',
  '--webkit-',
  '--moz-',
  '--color-',
  '--text-',
  '--font-heading',
  '--font-body',
  '--font-mono',
  '--spacing-',
  '--container-',
];

/**
 * Collect all custom properties defined in :root rules across stylesheets.
 * Returns a map of property name → computed value.
 */
export function getAllCustomProperties(): Map<string, string> {
  const props = new Map<string, string>();
  const computed = getComputedStyle(document.documentElement);

  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const sheet = document.styleSheets[i];
      const rules = sheet.cssRules;
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        if (
          rule instanceof CSSStyleRule &&
          rule.selectorText === ':root'
        ) {
          for (let k = 0; k < rule.style.length; k++) {
            const name = rule.style[k];
            if (name.startsWith('--')) {
              props.set(name, ''); // mark as discovered
            }
          }
        }
      }
    } catch {
      // CORS-restricted stylesheet — skip silently
    }
  }

  // Now read computed values for discovered properties
  for (const name of props.keys()) {
    const value = computed.getPropertyValue(name).trim();
    if (value && value !== 'initial') {
      props.set(name, value);
    } else {
      props.delete(name);
    }
  }

  // Filter out excluded prefixes
  for (const name of Array.from(props.keys())) {
    if (EXCLUDED_PREFIXES.some((prefix) => name.startsWith(prefix))) {
      props.delete(name);
    }
  }

  return props;
}

const HSL_PATTERN = /^\d{1,3}(\.\d+)?\s+\d{1,3}(\.\d+)?%\s+\d{1,3}(\.\d+)?%$/;
const LENGTH_PATTERN = /^-?[\d.]+\s*(px|rem|em|vh|vw|%)$/;

/** Infer the token type from its name and computed value. */
export function inferType(name: string, value: string): TokenType {
  if (HSL_PATTERN.test(value)) return 'hsl-color';
  if ((name.includes('font') || name.includes('size')) && LENGTH_PATTERN.test(value)) return 'font-size';
  if (LENGTH_PATTERN.test(value)) return 'length';
  if (value.includes('rgb') && /\d+px/.test(value)) return 'shadow';
  return 'other';
}

/** Infer the group from the property name. */
export function inferGroup(name: string, type: TokenType): string {
  // Priority-ordered pattern matching
  if (name.includes('brand')) return 'Brand Colors';
  if (name.includes('sidebar') || name.includes('topbar')) return 'Navigation';
  if (name.includes('surface') || name.includes('emphasis-surface')) return 'Surfaces';
  if (name.includes('border')) return 'Borders';
  if (name.includes('foreground-secondary') || name.includes('foreground-tertiary')) return 'Text Colors';
  if (name.includes('font-size-') || name === '--font-base') return 'Modular Type Scale';
  if (name.includes('shadow')) return 'Shadows';
  if (name.includes('radius') || name.includes('height') || name.includes('width') || name.includes('spacing')) return 'Spacing & Layout';

  // Fallback by type
  if (type === 'hsl-color') return 'Semantic Colors';
  if (type === 'font-size') return 'Modular Type Scale';
  if (type === 'length') return 'Spacing & Layout';
  if (type === 'shadow') return 'Shadows';

  return 'Other';
}

/** Generate a human-readable label from a CSS variable name. */
export function generateLabel(cssVar: string): string {
  return cssVar
    .replace(/^--/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Auto-detect all :root custom properties, infer type/group/label.
 * Returns a map keyed by CSS variable name.
 */
export function autoDetectTokens(): Map<string, AutoDetectedToken> {
  const properties = getAllCustomProperties();
  const result = new Map<string, AutoDetectedToken>();

  for (const [name, value] of properties) {
    const type = inferType(name, value);
    const group = inferGroup(name, type);
    const label = generateLabel(name);

    result.set(name, { label, group, type, value });
  }

  return result;
}
