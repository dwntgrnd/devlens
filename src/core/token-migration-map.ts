/**
 * Token migration suggestions: maps hardcoded utility classes
 * to semantic token-based replacements.
 *
 * Config-driven: the migration map is passed as a parameter,
 * not stored as a module-level constant.
 */

import type { MigrationEntry } from '../config/types';

export interface MigrationSuggestion {
  from: string;
  to: string;
  reason: string;
  confidence: 'high' | 'medium';
}

/**
 * Given an array of classes and a migration map, return suggestions
 * for classes that should be migrated to semantic tokens.
 */
export function getMigrationSuggestions(
  classes: string[],
  migrationMap: Record<string, MigrationEntry>,
): MigrationSuggestion[] {
  const suggestions: MigrationSuggestion[] = [];

  for (const cls of classes) {
    const entry = migrationMap[cls];
    if (entry) {
      suggestions.push({
        from: cls,
        to: entry.replacement,
        reason: entry.reason ?? '',
        confidence: entry.confidence ?? 'medium',
      });
    }
  }

  return suggestions;
}
