'use client';

import { useMemo, useState } from 'react';
import { useDevLensConfig } from '../hooks/use-devlens-config';
import { getMigrationSuggestions } from '../core/token-migration-map';

interface TokenMigrationSuggestionsProps {
  classes: string[];
  onApply: (oldClass: string, newClass: string) => void;
}

export function TokenMigrationSuggestions({
  classes,
  onApply,
}: TokenMigrationSuggestionsProps) {
  const { migrationMap } = useDevLensConfig();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const suggestions = useMemo(
    () => getMigrationSuggestions(classes, migrationMap),
    [classes, migrationMap]
  );

  const visible = suggestions.filter((s) => !dismissed.has(s.from));

  if (visible.length === 0) return null;

  return (
    <div className="te-migration-section">
      <div className="te-migration-header">
        Token Migrations
        <span className="te-badge te-badge-sm">{visible.length}</span>
      </div>
      {visible.map((suggestion) => (
        <div
          key={suggestion.from}
          className="te-migration-row"
          onClick={() => onApply(suggestion.from, suggestion.to)}
          title={`Replace ${suggestion.from} with ${suggestion.to}`}
        >
          <span className="te-migration-from">{suggestion.from}</span>
          <span className="te-migration-arrow">→</span>
          <span className="te-migration-to">{suggestion.to}</span>
          <span
            className="te-migration-confidence"
            data-confidence={suggestion.confidence}
          >
            {suggestion.confidence}
          </span>
          <button
            type="button"
            className="te-migration-dismiss"
            onClick={(e) => {
              e.stopPropagation();
              setDismissed((prev) => new Set(prev).add(suggestion.from));
            }}
            title="Dismiss suggestion"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
