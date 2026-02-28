/**
 * Config-driven token registry.
 * Merges auto-detected :root tokens with user-supplied overrides.
 * No hardcoded TOKEN_OVERRIDES — everything flows from DevLens config.
 */

import type { TokenOverride, TokenType } from '../config/types';
import { TOKEN_GROUPS } from '../config/token-groups';
import type { AutoDetectedToken } from './auto-detect';

export interface TokenDefinition {
  /** CSS variable name (e.g. '--brand-primary') */
  name: string;
  /** Human-readable label */
  label: string;
  /** Grouping category */
  group: string;
  /** Inferred or overridden token type */
  type: TokenType;
  /** Current computed value */
  value: string;
  /** Optional hint from config */
  hint?: string;
  /** Components or contexts that use this token */
  usedBy?: string[];
  /** Whether the token is hidden from the UI */
  hidden?: boolean;
  /** Whether this token is managed by the modular scale */
  managedByScale?: boolean;
}

/**
 * Build a unified registry by merging auto-detected tokens with config overrides.
 *
 * @param detected - Tokens discovered at runtime via `autoDetectTokens()`
 * @param overrides - Optional user-supplied overrides from `DevLensConfig.tokenOverrides`
 * @returns Record keyed by CSS variable name
 */
export function buildRegistry(
  detected: Map<string, AutoDetectedToken>,
  overrides?: Record<string, TokenOverride>,
): Record<string, TokenDefinition> {
  const registry: Record<string, TokenDefinition> = {};

  for (const [name, token] of detected) {
    registry[name] = {
      name,
      label: token.label,
      group: token.group,
      type: token.type,
      value: token.value,
    };
  }

  if (overrides) {
    for (const [name, override] of Object.entries(overrides)) {
      const existing = registry[name];
      if (existing) {
        // Merge override fields into detected token
        if (override.label) existing.label = override.label;
        if (override.group) existing.group = override.group;
        if (override.type) existing.type = override.type;
        if (override.hint) existing.hint = override.hint;
        if (override.usedBy) existing.usedBy = override.usedBy;
        if (override.hidden !== undefined) existing.hidden = override.hidden;
        if (override.managedByScale !== undefined) existing.managedByScale = override.managedByScale;
      } else {
        // Override-only token (not detected at runtime, but declared in config)
        registry[name] = {
          name,
          label: override.label ?? name.replace(/^--/, '').replace(/-/g, ' '),
          group: override.group ?? 'Other',
          type: override.type ?? 'other',
          value: '',
          hint: override.hint,
          usedBy: override.usedBy,
          hidden: override.hidden,
          managedByScale: override.managedByScale,
        };
      }
    }
  }

  return registry;
}

/**
 * Group tokens from the registry by their group field.
 * Returns only groups that have at least one visible token.
 *
 * @param registry - Token registry from `buildRegistry()`
 * @param extraGroups - Additional group names from `DevLensConfig.tokenGroups`
 * @returns Ordered array of `{ group, tokens }` entries
 */
export function getTokensByGroup(
  registry: Record<string, TokenDefinition>,
  extraGroups?: string[],
): { group: string; tokens: TokenDefinition[] }[] {
  // Build ordered group list: built-in groups first, then extras
  const allGroups: string[] = [...TOKEN_GROUPS];
  if (extraGroups) {
    for (const g of extraGroups) {
      if (!allGroups.includes(g)) allGroups.push(g);
    }
  }

  // Collect tokens that are not hidden, keyed by group
  const grouped = new Map<string, TokenDefinition[]>();
  for (const token of Object.values(registry)) {
    if (token.hidden) continue;
    const list = grouped.get(token.group) ?? [];
    list.push(token);
    grouped.set(token.group, list);
  }

  // Build result in group order, skip empty groups
  const result: { group: string; tokens: TokenDefinition[] }[] = [];
  for (const group of allGroups) {
    const tokens = grouped.get(group);
    if (tokens && tokens.length > 0) {
      result.push({ group, tokens });
    }
  }

  // Append any remaining groups not in the ordered list
  for (const [group, tokens] of grouped) {
    if (!allGroups.includes(group) && tokens.length > 0) {
      result.push({ group, tokens });
    }
  }

  return result;
}
