/**
 * HSL ↔ Hex color conversion utilities for the token editor.
 * Hand-rolled — no library dependency.
 */

export interface HslValue {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

/** Parse an HSL string like "27 87% 57%" into { h, s, l } */
export function parseHslString(raw: string): HslValue | null {
  const cleaned = raw.trim();
  // Match patterns: "27 87% 57%" or "27, 87%, 57%" or "hsl(27, 87%, 57%)"
  const match = cleaned.match(
    /^(?:hsl\()?\s*(\d+(?:\.\d+)?)\s*[,\s]\s*(\d+(?:\.\d+)?)%?\s*[,\s]\s*(\d+(?:\.\d+)?)%?\s*\)?$/
  );
  if (!match) return null;
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

/** Format { h, s, l } → "27 87% 57%" (CSS custom property format) */
export function formatHslString(hsl: HslValue): string {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%`;
}

/** Convert HSL values to a hex color string */
export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Convert a hex color string to HSL values */
export function hexToHsl(hex: string): HslValue {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  } else if (max === g) {
    h = ((b - r) / d + 2) * 60;
  } else {
    h = ((r - g) / d + 4) * 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}
