# DL-CC03 — Refactor High-Coupling Config Files

**Project:** DevLens standalone package extraction
**Package root:** /Users/dorenberge/WorkInProgress/VIBE/Dev_Lens
**Reference spec:** DL-Spec-01_Extraction-Plan.md (§4 Config API, §6 Phase C)
**Depends on:** DL-CC01 + DL-CC02 complete

---

## Objective

Refactor the four files in the scale-baseline dependency chain to remove all
AK12-specific data and read configuration from the DevLens context provider
instead. After this prompt, the entire scale/baseline subsystem is decoupled
from AK12.

**Files to create/rewrite (4):**

| File | Action | Coupling |
|------|--------|----------|
| `src/core/token-registry.ts` | CREATE (new, config-driven) | 🔴 High |
| `src/core/scale-baseline.ts` | CREATE (interfaces + helpers) | 🔴 High |
| `src/core/scale-step-lookup.ts` | REWRITE (already copied, replace AK12 import) | ⚠️ Medium |
| `src/hooks/use-scale-baseline.ts` | CREATE (config-driven) | ⚠️ Medium |

---

## File 1: src/core/token-registry.ts (CREATE)

This file currently exists in AK12 with 60+ hardcoded `TOKEN_OVERRIDES` entries.
The DevLens version ships with EMPTY default overrides. Consumers provide their
own overrides via `DevLensConfig.tokenOverrides`.

**Source reference:** `/Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/token-registry.ts`

**What to keep as-is:**
- `TokenType` type — already in `config/types.ts`, import from there
- `TokenDefinition` interface
- `TokenOverride` interface — already in `config/types.ts`, import from there
- `buildRegistry()` function signature and logic
- `getTokensByGroup()` function

**What to change:**
- REMOVE the `TOKEN_OVERRIDES` constant entirely (60+ entries gone)
- REMOVE the `TOKEN_GROUPS` constant (already in `config/token-groups.ts`)
- `buildRegistry()` accepts an optional `overrides` parameter instead of reading the module-level constant
- Import `TOKEN_GROUPS` from `../config/token-groups`
- Import types from `../config/types`

**Target implementation:**

```typescript
/**
 * Token registry — definitions for all CSS custom properties.
 * Auto-detection + optional consumer overrides merge.
 */

import type { AutoDetectedToken } from './auto-detect';
import type { TokenType, TokenOverride } from '../config/types';
import { TOKEN_GROUPS } from '../config/token-groups';

export interface TokenDefinition {
  cssVar: string;
  label: string;
  group: string;
  type: TokenType;
  defaultValue: string;
  hint?: string;
  usedBy?: string[];
  managedByScale?: boolean;
  autoDetected?: boolean;
}

/**
 * Merge auto-detected tokens with consumer-provided overrides
 * to produce the final registry.
 *
 * @param detected - Tokens found by scanning :root CSS variables
 * @param overrides - Optional consumer config (from DevLensConfig.tokenOverrides)
 */
export function buildRegistry(
  detected: Map<string, AutoDetectedToken>,
  overrides: Record<string, TokenOverride> = {}
): TokenDefinition[] {
  const registry: TokenDefinition[] = [];

  for (const [cssVar, auto] of detected) {
    const override = overrides[cssVar];

    // Skip hidden tokens
    if (override?.hidden) continue;

    registry.push({
      cssVar,
      label: override?.label ?? auto.label,
      group: override?.group ?? auto.group,
      type: override?.type ?? auto.type,
      defaultValue: auto.value,
      hint: override?.hint,
      usedBy: override?.usedBy,
      managedByScale: override?.managedByScale,
      autoDetected: !override,
    });
  }

  return registry;
}

/**
 * Get tokens grouped by their group name, with known groups ordered first.
 *
 * @param registry - Flat list of token definitions
 * @param extraGroups - Additional group names to include in ordering (from DevLensConfig.tokenGroups)
 */
export function getTokensByGroup(
  registry: TokenDefinition[],
  extraGroups: string[] = []
): Map<string, TokenDefinition[]> {
  const map = new Map<string, TokenDefinition[]>();

  // Known groups first, in order, then extra consumer groups
  const orderedGroups = [...TOKEN_GROUPS, ...extraGroups];

  for (const group of orderedGroups) {
    const tokens = registry.filter((t) => t.group === group);
    if (tokens.length > 0) {
      map.set(group, tokens);
    }
  }

  // Unknown groups sorted alphabetically after
  const knownSet = new Set<string>(orderedGroups);
  const unknownGroups = new Set<string>();
  for (const t of registry) {
    if (!knownSet.has(t.group)) {
      unknownGroups.add(t.group);
    }
  }
  for (const group of Array.from(unknownGroups).sort()) {
    const tokens = registry.filter((t) => t.group === group);
    if (tokens.length > 0) {
      map.set(group, tokens);
    }
  }

  return map;
}
```

---

## File 2: src/core/scale-baseline.ts (CREATE)

This replaces `scale-baseline-config.ts`. The AK12 version exported a hardcoded
`AK12_SCALE_BASELINE` constant. The DevLens version exports ONLY the interfaces
(already in `config/types.ts`) plus a helper to build CSS from any baseline config.

**What to keep:** The `buildBaselineCSS()` logic (currently in `use-scale-baseline.ts`)
is useful as a pure utility. Extract it here so both the hook and any future
consumers can use it.

**Target implementation:**

```typescript
/**
 * Scale baseline utilities.
 * Interfaces are in config/types.ts — this file provides
 * the CSS generation helper.
 */

import type { ScaleBaselineConfig } from '../config/types';

/**
 * Generate a CSS @layer rule from a scale baseline config.
 * Returns empty string if config has no mappings.
 */
export function buildBaselineCSS(config: ScaleBaselineConfig): string {
  if (!config.mapping.length) return '';

  const rules = config.mapping
    .map((m) => {
      const lines = [
        `    font-size: var(${m.fontSizeVar});`,
        `    line-height: var(${m.lineHeightVar});`,
      ];
      if (m.fontWeight !== undefined) {
        lines.push(`    font-weight: ${m.fontWeight};`);
      }
      return `  ${m.selector} {\n${lines.join('\n')}\n  }`;
    })
    .join('\n');

  return `@layer scale-baseline {\n${rules}\n}`;
}
```

---

## File 3: src/core/scale-step-lookup.ts (REWRITE)

This file was already copied by CC02 with a PENDING comment. It currently
imports `AK12_SCALE_BASELINE` directly. Refactor both functions to accept
a `ScaleBaselineConfig` parameter instead.

**Current state in Dev_Lens:** File exists at `src/core/scale-step-lookup.ts`
with `// PENDING: This file is refactored in DL-CC03` comment and a broken
import to `./scale-baseline-config`.

**Replace the entire file with:**

```typescript
/**
 * Scale step lookup — resolves expected typography values
 * from a consumer-provided baseline config.
 */

import type { ScaleBaselineMapping, ScaleBaselineConfig } from '../config/types';

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
 * Returns null for unmapped elements or if no baseline config provided.
 *
 * Reads live CSS variable values from the document, so results
 * reflect the current --font-base and ratio settings.
 */
export function getExpectedScaleStep(
  tagName: string,
  baseline: ScaleBaselineConfig | null
): ExpectedScaleStep | null {
  if (!baseline || !baseline.mapping.length) return null;

  const tag = tagName.toLowerCase();
  const mapping = baseline.mapping.find((m) => m.selector === tag);
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
 * Returns null if no baseline config provided.
 */
export function findNearestScaleStep(
  computedPx: number,
  baseline: ScaleBaselineConfig | null
): {
  mapping: ScaleBaselineMapping;
  expectedPx: number;
  deltaPx: number;
} | null {
  if (!baseline || !baseline.mapping.length) return null;

  const root = document.documentElement;
  const style = getComputedStyle(root);

  let nearest: { mapping: ScaleBaselineMapping; expectedPx: number; deltaPx: number } | null = null;

  const seen = new Set<string>();

  for (const mapping of baseline.mapping) {
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
```

---

## File 4: src/hooks/use-scale-baseline.ts (CREATE)

Refactored to read baseline config from DevLens context. Uses the namespace
from config for localStorage key scoping. Uses the CSS builder from
`core/scale-baseline.ts`.

**Target implementation:**

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDevLensConfig } from './use-devlens-config';
import { buildBaselineCSS } from '../core/scale-baseline';

const STYLE_ID_SUFFIX = '-scale-baseline';

export function useScaleBaseline() {
  const { scaleBaseline, namespace } = useDevLensConfig();
  const storageKey = `${namespace}-scale-baseline`;
  const styleId = `${namespace}${STYLE_ID_SUFFIX}`;

  const [isActive, setIsActive] = useState(false);

  // Check if baseline config has any mappings
  const hasBaseline = scaleBaseline.mapping.length > 0;

  function injectStyle(): void {
    if (!hasBaseline) return;
    if (document.getElementById(styleId)) return;
    const css = buildBaselineCSS(scaleBaseline);
    if (!css) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function removeStyle(): void {
    document.getElementById(styleId)?.remove();
  }

  // Hydrate from localStorage after mount
  useEffect(() => {
    if (!hasBaseline) return;
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey) === 'true';
      setIsActive(stored);
      if (stored) injectStyle();
    } catch {
      // localStorage unavailable
    }
  }, [hasBaseline]);

  // Sync style element with state
  useEffect(() => {
    if (isActive && hasBaseline) {
      injectStyle();
    } else {
      removeStyle();
    }
  }, [isActive, hasBaseline]);

  // Cleanup on unmount
  useEffect(() => {
    return () => removeStyle();
  }, []);

  const toggle = useCallback(() => {
    if (!hasBaseline) return;
    setIsActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, [hasBaseline, storageKey]);

  return { isActive, toggle, hasBaseline };
}
```

**Key changes from AK12 version:**
- Reads `scaleBaseline` and `namespace` from context (not hardcoded constant)
- localStorage key uses `namespace` prefix instead of hardcoded `'devlens-scale-baseline'`
- Style element ID uses `namespace` prefix
- Exposes `hasBaseline` so UI can conditionally show/hide the toggle
- Returns early / no-ops when baseline config is empty (zero-config safe)

---

## Callers to Update

After these four files are in place, check all existing files in `src/` for
imports referencing the old names or patterns:

1. **Any file importing from `./scale-baseline-config`** — does not exist, update to `./scale-baseline` or `../core/scale-baseline`
2. **Any file importing `AK12_SCALE_BASELINE`** — this export no longer exists. Callers must use context or accept the config as a parameter.
3. **Any file importing `TOKEN_OVERRIDES`** — this export no longer exists. Callers must pass overrides via `buildRegistry()` parameter.
4. **Any file importing `TOKEN_GROUPS`** — update import to `from '../config/token-groups'`

Run these checks:
```bash
grep -rn "AK12_SCALE_BASELINE" src/
grep -rn "TOKEN_OVERRIDES" src/
grep -rn "scale-baseline-config" src/
```

All should return zero results after this prompt completes.

---

## Verification Checklist

- [ ] `src/core/token-registry.ts` exists with NO `TOKEN_OVERRIDES` constant
- [ ] `buildRegistry()` accepts optional `overrides` parameter
- [ ] `getTokensByGroup()` accepts optional `extraGroups` parameter
- [ ] `src/core/scale-baseline.ts` exists with `buildBaselineCSS()` function
- [ ] NO `AK12_SCALE_BASELINE` export anywhere in the package
- [ ] `src/core/scale-step-lookup.ts` functions accept `baseline` parameter (not imported constant)
- [ ] `src/hooks/use-scale-baseline.ts` reads from DevLens context
- [ ] `useScaleBaseline()` returns `{ isActive, toggle, hasBaseline }`
- [ ] `grep -rn "AK12" src/` returns zero results
- [ ] `grep -rn "scale-baseline-config" src/` returns zero results
- [ ] `grep -rn "TOKEN_OVERRIDES" src/` returns zero results (as a module-level constant)
- [ ] All imports use relative paths, no `@/` aliases
- [ ] `npx tsc --noEmit` — errors should only be from files pending CC04/CC05 (not from these four files)
