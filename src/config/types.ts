/**
 * DevLens configuration types.
 * All config is optional — the package ships with sensible defaults.
 */

export type TokenType = 'hsl-color' | 'length' | 'shadow' | 'font-size' | 'other';

export interface TokenOverride {
  label?: string;
  group?: string;
  type?: TokenType;
  hint?: string;
  usedBy?: string[];
  hidden?: boolean;
  managedByScale?: boolean;
}

export interface ScaleBaselineMapping {
  /** CSS selector — 'h1', 'h2', 'p', etc. */
  selector: string;
  /** CSS variable for font-size — '--font-size-page-title' */
  fontSizeVar: string;
  /** CSS variable for line-height — '--line-height-page-title' */
  lineHeightVar: string;
  /** Font weight (omit to inherit) */
  fontWeight?: number;
  /** Human-readable label for the scale step */
  scaleLabel: string;
}

export interface ScaleBaselineConfig {
  mapping: ScaleBaselineMapping[];
}

export interface MigrationEntry {
  /** Suggested replacement class */
  replacement: string;
  /** Why this migration is recommended */
  reason?: string;
  /** Confidence level for this suggestion */
  confidence?: 'high' | 'medium';
}

export interface DevLensConfig {
  /** Project-specific token overrides (labels, groups, hints, visibility) */
  tokenOverrides?: Record<string, TokenOverride>;

  /** Additional token groups beyond the built-in defaults */
  tokenGroups?: string[];

  /** Scale baseline mappings (HTML element → expected token) */
  scaleBaseline?: ScaleBaselineConfig;

  /** Token migration suggestions (hardcoded class → token class) */
  migrationMap?: Record<string, MigrationEntry>;

  /** Project-specific text size classes for typography detection */
  projectTextSizeClasses?: string[];

  /** Namespace for localStorage keys and BroadcastChannel (default: 'devlens') */
  namespace?: string;

  /** Route path for detached window (default: '/dev/devlens-detached') */
  detachedRoute?: string;

  /** Font family for preview text (default: 'inherit') */
  previewFontFamily?: string;
}
