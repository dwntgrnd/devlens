/**
 * Generates a CSS string that applies scale-baseline variables to HTML elements.
 * Pure utility — no React context dependency.
 */

import type { ScaleBaselineConfig } from '../config/types';

/**
 * Build a CSS string that assigns font-size and line-height variables
 * to elements matching the baseline configuration selectors.
 *
 * The output is intended for injection into a `<style>` tag when
 * the scale baseline overlay is active.
 *
 * @param config - The scale baseline configuration from DevLens context
 * @returns A CSS string, or empty string if no mappings exist
 */
export function buildBaselineCSS(config: ScaleBaselineConfig): string {
  if (!config.mapping || config.mapping.length === 0) return '';

  const rules: string[] = [];

  for (const m of config.mapping) {
    const declarations: string[] = [
      `font-size: var(${m.fontSizeVar});`,
      `line-height: var(${m.lineHeightVar});`,
    ];

    if (m.fontWeight !== undefined) {
      declarations.push(`font-weight: ${m.fontWeight};`);
    }

    rules.push(`${m.selector} {\n  ${declarations.join('\n  ')}\n}`);
  }

  return rules.join('\n\n');
}
