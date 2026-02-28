/**
 * Modular type scale constants and math.
 *
 * Each font-size variable is derived from: size = base * ratio^step
 */

export interface FontStep {
  cssVar: string;
  step: number;
  label: string;
}

export const FONT_STEPS: FontStep[] = [
  { cssVar: '--font-size-overline', step: -2, label: 'Overline' },
  { cssVar: '--font-size-caption', step: -1, label: 'Caption' },
  { cssVar: '--font-size-subsection-sm', step: -0.5, label: 'Subsection Sm' },
  { cssVar: '--font-size-body', step: 0, label: 'Body' },
  { cssVar: '--font-size-subsection-heading', step: 0.5, label: 'Subsection' },
  { cssVar: '--font-size-section-heading', step: 1.5, label: 'Section Heading' },
  { cssVar: '--font-size-page-title', step: 3, label: 'Page Title' },
];

export interface ScaleRatio {
  label: string;
  value: number;
}

export const SCALE_RATIOS: ScaleRatio[] = [
  { label: '1.067 — Minor Second', value: 1.067 },
  { label: '1.125 — Major Second', value: 1.125 },
  { label: '1.200 — Minor Third', value: 1.2 },
  { label: '1.250 — Major Third', value: 1.25 },
  { label: '1.333 — Perfect Fourth', value: 1.333 },
  { label: '1.414 — Augmented Fourth', value: 1.414 },
  { label: '1.500 — Perfect Fifth', value: 1.5 },
  { label: '1.618 — Golden Ratio', value: 1.618 },
];

/** Calculate a font size in px for a given base, ratio, and step. */
export function calculateScale(base: number, ratio: number, step: number): string {
  const size = base * Math.pow(ratio, step);
  return `${Math.round(size * 100) / 100}px`;
}

/** Parse a px string to a number (e.g. "16px" → 16). Returns NaN on failure. */
export function parsePx(value: string): number {
  return parseFloat(value.replace('px', ''));
}

/**
 * Detect the closest scale ratio by comparing the current page-title size
 * against each ratio's prediction at step 3.
 */
export function detectClosestRatio(base: number, pageTitlePx: number): number {
  let closest = SCALE_RATIOS[2].value; // default Minor Third
  let minDiff = Infinity;

  for (const { value: ratio } of SCALE_RATIOS) {
    const predicted = base * Math.pow(ratio, 3);
    const diff = Math.abs(predicted - pageTitlePx);
    if (diff < minDiff) {
      minDiff = diff;
      closest = ratio;
    }
  }

  return closest;
}
