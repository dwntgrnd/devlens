// PENDING: This file is refactored in DL-CC03
import { AK12_SCALE_BASELINE } from './scale-baseline-config';
import type { ScaleBaselineMapping } from '../config/types';

export interface ExpectedScaleStep {
  /** The mapping entry from the baseline config */
  mapping: ScaleBaselineMapping;
  /** Resolved font-size in pixels from the live CSS variable */
  expectedPx: number;
  /** Resolved line-height value from the live CSS variable */
  expectedLineHeight: number;
}

/**
 * Look up what the modular scale expects for a given HTML tag name.
 * Returns null for unmapped elements.
 *
 * Reads live CSS variable values from the document, so results
 * reflect the current --font-base and ratio settings.
 */
export function getExpectedScaleStep(tagName: string): ExpectedScaleStep | null {
  const tag = tagName.toLowerCase();
  const mapping = AK12_SCALE_BASELINE.mapping.find((m) => m.selector === tag);
  if (!mapping) return null;

  const root = document.documentElement;
  const style = getComputedStyle(root);

  const fontSizeRaw = style.getPropertyValue(mapping.fontSizeVar).trim();
  const lineHeightRaw = style.getPropertyValue(mapping.lineHeightVar).trim();

  let expectedPx = parseFloat(fontSizeRaw);
  if (isNaN(expectedPx)) {
    // Fallback: create a temporary element to resolve the variable
    const temp = document.createElement('div');
    temp.style.fontSize = `var(${mapping.fontSizeVar})`;
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    document.body.appendChild(temp);
    expectedPx = parseFloat(getComputedStyle(temp).fontSize);
    document.body.removeChild(temp);
  }

  const expectedLineHeight = parseFloat(lineHeightRaw) || 1.5;

  return { mapping, expectedPx, expectedLineHeight };
}

/**
 * Find the nearest scale step to a given pixel value.
 * Useful for unmapped elements to show "nearest scale step" context.
 */
export function findNearestScaleStep(computedPx: number): {
  mapping: ScaleBaselineMapping;
  expectedPx: number;
  deltaPx: number;
} | null {
  const root = document.documentElement;
  const style = getComputedStyle(root);

  let nearest: { mapping: ScaleBaselineMapping; expectedPx: number; deltaPx: number } | null = null;

  // Deduplicate by fontSizeVar (p and h5 both map to body, etc.)
  const seen = new Set<string>();

  for (const mapping of AK12_SCALE_BASELINE.mapping) {
    if (seen.has(mapping.fontSizeVar)) continue;
    seen.add(mapping.fontSizeVar);

    const raw = style.getPropertyValue(mapping.fontSizeVar).trim();
    const px = parseFloat(raw);
    if (isNaN(px)) continue;

    const delta = Math.abs(computedPx - px);
    if (!nearest || delta < Math.abs(nearest.deltaPx)) {
      nearest = { mapping, expectedPx: px, deltaPx: computedPx - px };
    }
  }

  return nearest;
}
