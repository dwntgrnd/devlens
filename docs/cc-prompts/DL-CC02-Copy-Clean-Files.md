# DL-CC02 — Copy Clean Files

**Project:** DevLens standalone package extraction
**Package root:** /Users/dorenberge/WorkInProgress/VIBE/Dev_Lens
**Source:** /Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/
**Reference spec:** DL-Spec-01_Extraction-Plan.md (§2 File Inventory, §5 Package Structure)
**Depends on:** DL-CC01 complete (scaffold exists)

---

## Objective

Copy all 22 clean (zero-coupling) files from AK12 source to DevLens package.
Update internal import paths from `@/` aliases to relative paths. Verify no
AK12-specific imports remain.

---

## Files to Copy

### Utilities → src/core/

| Source file | Destination |
|-------------|-------------|
| `auto-detect.ts` | `src/core/auto-detect.ts` |
| `color-utils.ts` | `src/core/color-utils.ts` |
| `modular-scale.ts` | `src/core/modular-scale.ts` |
| `class-conflict-detection.ts` | `src/core/class-conflict-detection.ts` |
| `class-dictionary.ts` | `src/core/class-dictionary.ts` |

### Hooks → src/hooks/

| Source file | Destination |
|-------------|-------------|
| `use-element-inspector.ts` | `src/hooks/use-element-inspector.ts` |

### Components → src/components/

| Source file | Destination |
|-------------|-------------|
| `HslColorControl.tsx` | `src/components/HslColorControl.tsx` |
| `LengthControl.tsx` | `src/components/LengthControl.tsx` |
| `ShadowControl.tsx` | `src/components/ShadowControl.tsx` |
| `InspectorSwitch.tsx` | `src/components/InspectorSwitch.tsx` |
| `ElementSelectorOverlay.tsx` | `src/components/ElementSelectorOverlay.tsx` |
| `ClassCategoryGroup.tsx` | `src/components/ClassCategoryGroup.tsx` |
| `ClassChip.tsx` | `src/components/ClassChip.tsx` |
| `ClassSuggestionDropdown.tsx` | `src/components/ClassSuggestionDropdown.tsx` |
| `TokenMigrationSuggestions.tsx` | `src/components/TokenMigrationSuggestions.tsx` |
| `RawCssInput.tsx` | `src/components/RawCssInput.tsx` |
| `TokenCreationForm.tsx` | `src/components/TokenCreationForm.tsx` |
| `TokenCreationZone.tsx` | `src/components/TokenCreationZone.tsx` |
| `TokenEditorDiffOutput.tsx` | `src/components/TokenEditorDiffOutput.tsx` |
| `ElementInspectorTab.tsx` | `src/components/ElementInspectorTab.tsx` |
| `TypographyAudit.tsx` | `src/components/TypographyAudit.tsx` |

**Total: 21 files**

(Note: spec says 22 clean files, but `TokenEditorLoader.tsx` is replaced by `DevLens.tsx` from CC01 — it is not copied. That accounts for the 22nd.)

---

## Import Path Rewriting Rules

All files currently use `@/components/dev/token-editor/` alias imports that resolve
within the AK12 project. These must be converted to relative imports within the
DevLens package structure.

### Pattern replacements:

**Within src/core/ files:**
- `from './<other-core-file>'` → keep as-is (same directory)
- `from '@/components/dev/token-editor/<file>'` → `from './<file>'` (if target is also in core/) or `from '../hooks/<file>'` or `from '../components/<file>'`

**Within src/hooks/ files:**
- `from './<other-file>'` that referenced sibling in token-editor/ → adjust to `from '../core/<file>'` or `from './<file>'` depending on target location

**Within src/components/ files:**
- Same pattern — update cross-references based on the new directory structure:
  - Core utilities: `from '../core/<file>'`
  - Hooks: `from '../hooks/<file>'`
  - Sibling components: `from './<file>'`
  - Config types: `from '../config/types'`

### Critical: Check each file for:
1. Any `@/` prefixed imports — ALL must be replaced
2. Any `from './` imports that reference files now in a different subdirectory
3. Any imports from files NOT in the clean list (these files have coupling and will be handled in CC03-CC05 — for now, leave the import but add a `// TODO: DL-CC03` or `// TODO: DL-CC04` comment so it's flagged)

---

## Handling Cross-References to Non-Clean Files

Some clean files may import from files that are NOT in this batch (medium/high coupling files handled in CC03-CC05). For these:

1. **Do NOT remove the import** — the file needs it to function
2. **Copy the file anyway** — update the import path to where the file WILL live per the spec's §5 directory structure
3. **Add a comment:** `// PENDING: This file is refactored in DL-CC03/CC04`
4. **The file will have a TypeScript error until CC03/CC04 runs** — that's expected

Known cross-references to watch for:
- Components importing from `token-registry.ts` (→ `../core/token-registry.ts`, pending CC03)
- Components importing from `class-categories.ts` (→ `../core/class-categories.ts`, pending CC04)
- Components importing from `scale-baseline-config.ts` (→ `../core/scale-baseline.ts`, pending CC03)
- Components importing from `token-migration-map.ts` (→ `../core/token-migration-map.ts`, pending CC04)
- Components importing from `use-token-editor.ts` (→ `../hooks/use-token-editor.ts`, pending CC05)
- Components importing from `use-dock-position.ts` (→ `../hooks/use-dock-position.ts`, pending CC05)
- Components importing from `use-scale-baseline.ts` (→ `../hooks/use-scale-baseline.ts`, pending CC04)

---

## Post-Copy Verification

After all files are copied and imports updated:

- [ ] Run `grep -r "@/" src/` — must return zero results (no AK12 alias imports)
- [ ] Run `grep -r "ak12" src/ -i` — must return zero results
- [ ] Run `grep -r "AK12" src/` — must return zero results
- [ ] Count files: `src/core/` has 5 files, `src/hooks/` has 2 files (use-element-inspector + use-devlens-config from CC01), `src/components/` has 15 files
- [ ] Each file's internal imports point to correct relative paths per the new structure
- [ ] TypeScript errors exist ONLY for imports referencing files pending CC03-CC05 (noted with PENDING comments)
- [ ] No other TypeScript errors (run `npx tsc --noEmit` — errors should only be unresolved modules for pending files)
