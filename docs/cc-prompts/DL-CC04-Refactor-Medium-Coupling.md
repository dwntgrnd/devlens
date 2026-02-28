# DL-CC04 — Refactor Medium-Coupling Files

**Project:** DevLens standalone package extraction
**Package root:** /Users/dorenberge/WorkInProgress/VIBE/Dev_Lens
**Reference spec:** DL-Spec-01_Extraction-Plan.md (§6 Phase C — CC04)
**Depends on:** DL-CC01 + DL-CC02 + DL-CC03 complete

---

## Objective

Create two config-driven utility files that replace AK12-specific hardcoded
data with parameterized functions. After this prompt, `class-categories.ts`
and `token-migration-map.ts` exist in `src/core/` with no AK12 references,
and the two components that import them (`ElementInspectorTab.tsx`,
`TokenMigrationSuggestions.tsx`, `TypographyAudit.tsx`) compile without
PENDING comments.

**Note:** `TokenEditorControls.tsx` (also medium coupling) is deferred to
DL-CC06 where the internal accordion component is created first, then the
import swap happens in a single session.

**Files to create (2):**

| File | Action | Coupling |
|------|--------|----------|
| `src/core/class-categories.ts` | CREATE (config-driven) | ⚠️ Medium |
| `src/core/token-migration-map.ts` | CREATE (config-driven) | ⚠️ Medium |

**Files to update (3 — remove PENDING comments, fix imports):**

| File | Change |
|------|--------|
| `src/components/ElementInspectorTab.tsx` | Remove PENDING comment, import stays as-is |
| `src/components/TokenMigrationSuggestions.tsx` | Remove PENDING comment, update to pass config |
| `src/components/TypographyAudit.tsx` | Remove PENDING comment, import stays as-is |

---

## File 1: src/core/class-categories.ts (CREATE)

This file does NOT exist in Dev_Lens yet. Create it from scratch using the
AK12 source as reference, but with these changes:

**AK12 source reference:** `/Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/class-categories.ts`

**What to keep from AK12 version (logic is identical):**
- `CATEGORY_ORDER` constant
- `CategoryName` type
- `CATEGORY_MAP` constant (all prefix arrays)
- `TEXT_SIZE_KEYWORDS` set (standard Tailwind text-* sizes)
- `getBaseClass()` private helper
- `hasStateVariant()` private helper
- `categorizeClass()` function
- `categorizeClasses()` function
- `CategoryGroup` interface
- `findFontSizeClasses()` function
- `TEXT_NON_SIZE_PREFIXES` array

**What to REMOVE:**
- `PROJECT_TEXT_SIZE_CLASSES` hardcoded set (AK12-specific: `text-page-title`, `text-section-heading`, etc.)

**What to ADD:**
- `categorizeClass()` and `findFontSizeClasses()` each accept an optional
  `projectTextSizeClasses?: Set<string>` parameter
- When provided, these project classes are treated as Typography (not Colors)
  in `categorizeClass()`, and as valid font-size classes in `findFontSizeClasses()`
- The parameter defaults to an empty set when not provided

**Target implementation:**

```typescript
/**
 * Tailwind class categorization utility for the Element Inspector.
 * Pure utility — zero external dependencies.
 *
 * Project-specific text size classes (e.g. text-page-title) are passed
 * as a parameter rather than hardcoded, enabling config-driven behavior.
 */

export const CATEGORY_ORDER = [
  'Layout',
  'Spacing',
  'Sizing',
  'Typography',
  'Colors',
  'Borders',
  'Effects',
  'State',
  'Other',
] as const;

export type CategoryName = (typeof CATEGORY_ORDER)[number];

const CATEGORY_MAP: Record<string, string[]> = {
  Layout: [
    'flex', 'grid', 'block', 'inline', 'hidden', 'relative', 'absolute',
    'fixed', 'sticky', 'overflow', 'z-', 'float', 'clear', 'isolat',
    'object-', 'top-', 'right-', 'bottom-', 'left-', 'inset-', 'container',
    'columns-', 'items-', 'justify-', 'self-', 'place-', 'order-',
    'col-', 'row-', 'auto-cols-', 'auto-rows-', 'grid-cols-', 'grid-rows-',
  ],
  Spacing: [
    'p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-', 'm-', 'mx-', 'my-',
    'mt-', 'mr-', 'mb-', 'ml-', 'gap-', 'space-', '-m', '-mx-', '-my-',
    '-mt-', '-mr-', '-mb-', '-ml-',
  ],
  Sizing: ['w-', 'h-', 'min-w-', 'min-h-', 'max-w-', 'max-h-', 'size-'],
  Typography: [
    'font-', 'leading-', 'tracking-', 'whitespace-', 'break-', 'truncate',
    'uppercase', 'lowercase', 'capitalize', 'italic', 'underline',
    'line-through', 'no-underline', 'antialiased', 'decoration-',
    'underline-offset-', 'line-clamp-',
  ],
  Colors: ['text-', 'bg-', 'from-', 'via-', 'to-'],
  Borders: ['border', 'rounded', 'outline', 'ring', 'divide'],
  Effects: [
    'shadow', 'opacity-', 'blur', 'brightness', 'contrast', 'grayscale',
    'backdrop-', 'transition', 'duration-', 'ease-', 'animate-', 'delay-',
    'scale-', 'rotate-', 'translate-', 'skew-', 'transform',
  ],
  State: [
    'hover:', 'focus:', 'active:', 'disabled:', 'group-', 'peer-',
    'first:', 'last:', 'odd:', 'even:', 'focus-within:', 'focus-visible:',
    'aria-', 'data-',
  ],
};

/** Standard Tailwind text size keywords — these text-* classes go to Typography, not Colors */
export const TEXT_SIZE_KEYWORDS = new Set([
  'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl',
  'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl',
  'text-7xl', 'text-8xl', 'text-9xl',
  'text-wrap', 'text-nowrap', 'text-balance', 'text-pretty',
  'text-left', 'text-center', 'text-right', 'text-justify',
  'text-start', 'text-end',
]);

/** Non-size text-* keywords to exclude from font-size detection */
const TEXT_NON_SIZE_PREFIXES = [
  'text-wrap', 'text-nowrap', 'text-balance', 'text-pretty',
  'text-left', 'text-center', 'text-right', 'text-justify',
  'text-start', 'text-end',
];

/**
 * Strip state variant prefixes to get the base utility class.
 * e.g. "hover:bg-gray-100" → "bg-gray-100"
 */
function getBaseClass(cls: string): string {
  const parts = cls.split(':');
  return parts[parts.length - 1];
}

/**
 * Check if a class has a state variant prefix.
 */
function hasStateVariant(cls: string): boolean {
  return CATEGORY_MAP.State.some((prefix) => cls.startsWith(prefix));
}

/**
 * Categorize a single Tailwind class name.
 *
 * @param className - The class to categorize
 * @param projectTextSizeClasses - Optional set of project-specific text-* classes
 *   that should be categorized as Typography (not Colors). These are classes like
 *   'text-page-title' that map to design token font sizes. Defaults to empty set.
 */
export function categorizeClass(
  className: string,
  projectTextSizeClasses: Set<string> = new Set(),
): CategoryName {
  if (hasStateVariant(className)) {
    return 'State';
  }

  const cls = getBaseClass(className);

  // text-* disambiguation: standard sizes → Typography, project sizes → Typography, others → Colors
  if (cls.startsWith('text-')) {
    if (TEXT_SIZE_KEYWORDS.has(cls) || projectTextSizeClasses.has(cls)) {
      return 'Typography';
    }
    return 'Colors';
  }

  if (cls.startsWith('decoration-')) {
    return 'Typography';
  }

  for (const category of CATEGORY_ORDER) {
    if (category === 'State' || category === 'Other') continue;
    const prefixes = CATEGORY_MAP[category];
    if (!prefixes) continue;

    for (const prefix of prefixes) {
      if (cls === prefix || cls.startsWith(prefix)) {
        return category;
      }
    }
  }

  return 'Other';
}

/**
 * Identify which class(es) on an element are setting font-size.
 * Matches standard Tailwind sizes, project token classes, and arbitrary values.
 *
 * @param classes - Array of class names to check
 * @param projectTextSizeClasses - Optional set of project-specific text-* size classes
 */
export function findFontSizeClasses(
  classes: string[],
  projectTextSizeClasses: Set<string> = new Set(),
): string[] {
  return classes.filter((cls) => {
    const base = getBaseClass(cls);
    // Standard Tailwind text size keywords (excluding non-size text-* classes)
    if (TEXT_SIZE_KEYWORDS.has(base) && !TEXT_NON_SIZE_PREFIXES.some((p) => base.startsWith(p))) {
      return true;
    }
    // Project token classes from consumer config
    if (projectTextSizeClasses.has(base)) {
      return true;
    }
    // Arbitrary value: text-[...]
    if (base.startsWith('text-[') && base.endsWith(']')) {
      const inner = base.slice(6, -1);
      if (/^\d|^clamp|^calc|^var/.test(inner)) return true;
    }
    return false;
  });
}

export interface CategoryGroup {
  category: CategoryName;
  classes: string[];
}

/**
 * Categorize an array of classes into ordered groups.
 * Empty groups are filtered out.
 *
 * @param classes - Array of class names
 * @param projectTextSizeClasses - Optional project-specific text size classes
 */
export function categorizeClasses(
  classes: string[],
  projectTextSizeClasses: Set<string> = new Set(),
): CategoryGroup[] {
  const grouped: Record<CategoryName, string[]> = {
    Layout: [],
    Spacing: [],
    Sizing: [],
    Typography: [],
    Colors: [],
    Borders: [],
    Effects: [],
    State: [],
    Other: [],
  };

  for (const cls of classes) {
    const category = categorizeClass(cls, projectTextSizeClasses);
    grouped[category].push(cls);
  }

  return CATEGORY_ORDER
    .map((category) => ({ category, classes: grouped[category] }))
    .filter((g) => g.classes.length > 0);
}
```

---

## File 2: src/core/token-migration-map.ts (CREATE)

This file does NOT exist in Dev_Lens yet. The AK12 version has its own
`MIGRATION_MAP` with AK12-specific token targets. The DevLens version:
- Exports a pure function `getMigrationSuggestions()` that accepts the
  migration map as a parameter
- Consumers provide their own map via `DevLensConfig.migrationMap`
- The generic defaults live in `config/migration-defaults.ts` (already created)

**AK12 source reference:** `/Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/token-migration-map.ts`

**Interface alignment:** The AK12 `MigrationSuggestion` has `{ from, to, confidence, reason }`.
The DevLens `MigrationEntry` (in `config/types.ts`) has `{ replacement, reason }`.
The `confidence` field was AK12-specific — DevLens drops it. The return type
of `getMigrationSuggestions()` needs to match what `TokenMigrationSuggestions.tsx`
expects: `{ from, to, confidence?, reason }[]`.

Wait — `TokenMigrationSuggestions.tsx` currently renders `suggestion.confidence`
and uses `data-confidence` attribute. We have two choices:
1. Keep `confidence` in the DevLens API — consumers can optionally provide it
2. Drop `confidence` and update the component

**Decision: Keep `confidence` as optional.** It's useful metadata and cheap to support.

**Update `config/types.ts`** — add `confidence` to `MigrationEntry`:

```typescript
export interface MigrationEntry {
  /** Suggested replacement class */
  replacement: string;
  /** Confidence level of the suggestion */
  confidence?: 'high' | 'medium';
  /** Why this migration is recommended */
  reason?: string;
}
```

**Update `config/migration-defaults.ts`** — add confidence to each entry:

```typescript
import type { MigrationEntry } from './types';

export const DEFAULT_MIGRATION_MAP: Record<string, MigrationEntry> = {
  'text-black': {
    replacement: 'text-foreground',
    confidence: 'high',
    reason: 'Use semantic foreground token for theme support',
  },
  'text-white': {
    replacement: 'text-background',
    confidence: 'medium',
    reason: 'Use semantic background token for theme support',
  },
  'text-gray-900': {
    replacement: 'text-foreground',
    confidence: 'high',
    reason: 'Use semantic foreground token',
  },
  'text-gray-500': {
    replacement: 'text-muted-foreground',
    confidence: 'high',
    reason: 'Use semantic muted foreground token',
  },
  'bg-white': {
    replacement: 'bg-background',
    confidence: 'high',
    reason: 'Use semantic background token for theme support',
  },
  'bg-gray-100': {
    replacement: 'bg-muted',
    confidence: 'medium',
    reason: 'Use semantic muted token',
  },
  'border-gray-200': {
    replacement: 'border-border',
    confidence: 'high',
    reason: 'Use semantic border token',
  },
  'border-gray-300': {
    replacement: 'border-input',
    confidence: 'medium',
    reason: 'Use semantic input border token',
  },
};
```

**Target implementation for `src/core/token-migration-map.ts`:**

```typescript
/**
 * Token migration suggestions — pure utility function.
 * The migration map itself comes from DevLens config (merged defaults + consumer overrides).
 */

import type { MigrationEntry } from '../config/types';

export interface MigrationSuggestion {
  /** Original class name found on the element */
  from: string;
  /** Suggested replacement class */
  to: string;
  /** Confidence level (defaults to 'medium' if not specified in config) */
  confidence: 'high' | 'medium';
  /** Human-readable reason for the suggestion */
  reason: string;
}

/**
 * Get migration suggestions for an array of current classes.
 *
 * @param classes - Current classes on the element
 * @param migrationMap - The merged migration map from DevLens config
 * @returns Array of suggestions for classes that have migration entries
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
        confidence: entry.confidence ?? 'medium',
        reason: entry.reason ?? 'Token migration suggested',
      });
    }
  }

  return suggestions;
}
```

---

## Caller Updates

### 1. src/components/ElementInspectorTab.tsx

Remove the PENDING comment. The import path `../core/class-categories` is
already correct. However, the call sites need to pass `projectTextSizeClasses`
from config.

**Find this line (near top):**
```typescript
// PENDING: This file is refactored in DL-CC04
import { categorizeClasses } from '../core/class-categories';
```

**Replace with:**
```typescript
import { categorizeClasses } from '../core/class-categories';
```

**Find ALL calls to `categorizeClasses(...)` in this file.** Each needs to pass
the project text size classes. Add the config import and build the set:

**Add near the top imports:**
```typescript
import { useDevLensConfig } from '../hooks/use-devlens-config';
```

**Inside the component function, add:**
```typescript
const { projectTextSizeClasses: projectClasses } = useDevLensConfig();
const projectTextSizeSet = useMemo(
  () => new Set(projectClasses),
  [projectClasses]
);
```

**Then update every `categorizeClasses(someClasses)` call to:**
```typescript
categorizeClasses(someClasses, projectTextSizeSet)
```

Search the file for all occurrences of `categorizeClasses(` and update each one.

### 2. src/components/TypographyAudit.tsx

Remove the PENDING comment. Update `findFontSizeClasses()` calls to pass
the project text size set.

**Find this line (near top):**
```typescript
// PENDING: This file is refactored in DL-CC04
import { findFontSizeClasses } from '../core/class-categories';
```

**Replace with:**
```typescript
import { findFontSizeClasses } from '../core/class-categories';
```

**This component already imports `useDevLensConfig` (check — it does).** Add:
```typescript
const { projectTextSizeClasses: projectClasses } = useDevLensConfig();
const projectTextSizeSet = useMemo(
  () => new Set(projectClasses),
  [projectClasses]
);
```

**Update every `findFontSizeClasses(someClasses)` call to:**
```typescript
findFontSizeClasses(someClasses, projectTextSizeSet)
```

Import `useMemo` from React if not already imported.

### 3. src/components/TokenMigrationSuggestions.tsx

Remove the PENDING comment. Update to receive the migration map from config
and pass it to `getMigrationSuggestions()`.

**Find this line (near top):**
```typescript
// PENDING: This file is refactored in DL-CC04
import { getMigrationSuggestions } from '../core/token-migration-map';
```

**Replace with:**
```typescript
import { getMigrationSuggestions } from '../core/token-migration-map';
import { useDevLensConfig } from '../hooks/use-devlens-config';
```

**Inside the component function, add:**
```typescript
const { migrationMap } = useDevLensConfig();
```

**Find the `getMigrationSuggestions(classes)` call and update to:**
```typescript
getMigrationSuggestions(classes, migrationMap)
```

The `suggestion.confidence` and `suggestion.to` fields match the existing JSX
template — no other changes needed in this component.

---

## Verification Checklist

- [ ] `src/core/class-categories.ts` exists and exports `categorizeClass`, `categorizeClasses`, `findFontSizeClasses`
- [ ] `categorizeClass()` accepts optional `projectTextSizeClasses` parameter
- [ ] `findFontSizeClasses()` accepts optional `projectTextSizeClasses` parameter
- [ ] `categorizeClasses()` accepts optional `projectTextSizeClasses` parameter
- [ ] NO `PROJECT_TEXT_SIZE_CLASSES` hardcoded set in the file
- [ ] `src/core/token-migration-map.ts` exists and exports `getMigrationSuggestions`, `MigrationSuggestion`
- [ ] `getMigrationSuggestions()` accepts `migrationMap` parameter (no module-level constant)
- [ ] `config/types.ts` has `confidence?: 'high' | 'medium'` on `MigrationEntry`
- [ ] `config/migration-defaults.ts` entries include `confidence` field
- [ ] `ElementInspectorTab.tsx` — no PENDING comment, passes `projectTextSizeSet` to `categorizeClasses()`
- [ ] `TypographyAudit.tsx` — no PENDING comment, passes `projectTextSizeSet` to `findFontSizeClasses()`
- [ ] `TokenMigrationSuggestions.tsx` — no PENDING comment, passes `migrationMap` to `getMigrationSuggestions()`
- [ ] `grep -rn "PENDING" src/` returns zero results for class-categories and token-migration references (CC06 PENDING for accordion is expected to remain)
- [ ] `grep -rn "AK12\|ak12" src/` returns zero results
- [ ] All imports use relative paths, no `@/` aliases
- [ ] `npx tsc --noEmit` — errors should only be from files pending CC05/CC06 (not from these files)
