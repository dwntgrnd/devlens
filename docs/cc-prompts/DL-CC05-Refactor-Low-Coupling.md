# DL-CC05 — Refactor Low-Coupling Files

**Project:** DevLens standalone package extraction
**Package root:** /Users/dorenberge/WorkInProgress/VIBE/Dev_Lens
**Reference spec:** DL-Spec-01_Extraction-Plan.md (§6 Phase C — CC05)
**Depends on:** DL-CC01 + DL-CC02 + DL-CC03 + DL-CC04 complete

---

## Objective

Refactor six low-coupling files to replace hardcoded AK12-specific strings
with config-driven values from the DevLens context provider. All changes
are mechanical: import `useDevLensConfig()` (in hooks/components) or accept
config values as parameters (in pure utilities), then replace hardcoded
strings.

After this prompt, every `ak12` reference is eliminated from the codebase
and all namespace/route/font strings are config-driven.

**Files to rewrite (6):**

| File | Current Location | Coupling | Key Change |
|------|-----------------|----------|------------|
| `use-token-editor.ts` | `src/hooks/` | 🔧 Low | BroadcastChannel name → namespace from config |
| `use-dock-position.ts` | `src/hooks/` | 🔧 Low | localStorage keys → namespace from config |
| `use-detached-window.ts` | `src/hooks/` | 🔧 Low | Window name + route → namespace + detachedRoute from config |
| `ModularScaleControl.tsx` | `src/components/` | 🔧 Low | `var(--font-manrope)` → previewFontFamily from config |
| `TokenEditorDrawer.tsx` | `src/components/` | 🔧 Low | Font reference + rename to DevLensDrawer.tsx |
| `cc-prompt-generator.ts` | `src/core/` | 🔧 Low | AK12 file path templates → generic placeholders |

---

## File 1: src/hooks/use-token-editor.ts (REWRITE)

**AK12 source reference:** `/Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/use-token-editor.ts`

**Current state in Dev_Lens:** CC02 copied this file as-is. It has a hardcoded
`CHANNEL_NAME = 'ak12-token-editor'` and imports from AK12's `./token-registry`.

**Changes:**

1. Replace `const CHANNEL_NAME = 'ak12-token-editor'` — read `namespace` from config
2. Fix import: `./token-registry` → `../core/token-registry`
3. Fix import: `./auto-detect` → `../core/auto-detect`
4. Add import for `useDevLensConfig`
5. Build channel name as `${namespace}-token-editor`

**Important:** `useTokenEditor` is a hook, so it CAN call `useDevLensConfig()` directly.

**Specific changes (find → replace):**

```typescript
// REMOVE this line:
const CHANNEL_NAME = 'ak12-token-editor';

// ADD import at top:
import { useDevLensConfig } from './use-devlens-config';

// FIX existing imports:
// FROM: import { buildRegistry, type TokenDefinition } from './token-registry';
// TO:
import { buildRegistry, type TokenDefinition } from '../core/token-registry';

// FROM: import { autoDetectTokens } from './auto-detect';
// TO:
import { autoDetectTokens } from '../core/auto-detect';
```

**Inside the hook function body, add at the top:**
```typescript
const { namespace, tokenOverrides, tokenGroups } = useDevLensConfig();
const channelName = `${namespace}-token-editor`;
```

**Replace ALL occurrences of `CHANNEL_NAME` with `channelName`:**
- `new BroadcastChannel(CHANNEL_NAME)` → `new BroadcastChannel(channelName)`

**Update `buildRegistry()` call** to pass config overrides:

The current AK12 version calls `buildRegistry(detected)`. The DevLens version
(from CC03) has the signature `buildRegistry(detected, overrides?)`.

Find the `useEffect` that calls `buildRegistry`:
```typescript
const registry = buildRegistry(detected);
```
Replace with:
```typescript
const registry = buildRegistry(detected, tokenOverrides);
```

**Update `getTokensByGroup()` usage if present** — the CC03 version accepts
`extraGroups`. If this hook calls `getTokensByGroup(registry)`, update to
`getTokensByGroup(registry, tokenGroups)`. Check the file — if
`getTokensByGroup` is not called in this hook (it may be called in
`TokenEditorControls.tsx` instead), skip this.

**Note on `ScaleMetadata` interface:** The AK12 version defines
`ScaleMetadata` in this file AND in `ModularScaleControl.tsx`. Keep it in
this file (it's used by the hook's return type). `ModularScaleControl.tsx`
should import it from here. If there's a duplicate, remove it from
`ModularScaleControl.tsx` and add the import.

---

## File 2: src/hooks/use-dock-position.ts (REWRITE)

**AK12 source reference:** `/Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/use-dock-position.ts`

**Changes:**

1. Replace hardcoded keys:
   - `const DOCK_KEY = 'ak12-token-editor-dock'` → derive from namespace
   - `const OPEN_KEY = 'ak12-token-editor-open'` → derive from namespace
2. Add import for `useDevLensConfig`

**Specific changes:**

```typescript
// REMOVE these lines:
const DOCK_KEY = 'ak12-token-editor-dock';
const OPEN_KEY = 'ak12-token-editor-open';

// ADD import at top:
import { useDevLensConfig } from './use-devlens-config';
```

**Inside the hook function body, add at the top:**
```typescript
const { namespace } = useDevLensConfig();
const DOCK_KEY = `${namespace}-dock`;
const OPEN_KEY = `${namespace}-open`;
```

The rest of the hook logic stays identical — `readStorage`, `setDock`,
`setIsOpen`, `toggle` all use these keys via closure.

---

## File 3: src/hooks/use-detached-window.ts (REWRITE)

**AK12 source reference:** `/Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/use-detached-window.ts`

**Changes:**

1. Replace hardcoded window name `'ak12-token-editor'` → derive from namespace
2. Replace hardcoded route `'/dev/token-editor-detached'` → read `detachedRoute` from config
3. Add import for `useDevLensConfig`

**Specific changes:**

```typescript
// ADD import at top:
import { useDevLensConfig } from './use-devlens-config';
```

**Inside the hook function body, add at the top:**
```typescript
const { namespace, detachedRoute } = useDevLensConfig();
const windowName = `${namespace}-detached`;
```

**In the `detach` callback, find:**
```typescript
const popup = window.open(
  '/dev/token-editor-detached',
  'ak12-token-editor',
  'width=380,height=700,menubar=no,toolbar=no,location=no,status=no'
);
```

**Replace with:**
```typescript
const popup = window.open(
  detachedRoute,
  windowName,
  'width=380,height=700,menubar=no,toolbar=no,location=no,status=no'
);
```

Everything else in this hook stays identical.

---

## File 4: src/components/ModularScaleControl.tsx (REWRITE)

**AK12 source reference:** `/Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/ModularScaleControl.tsx`

**Current state in Dev_Lens:** CC02 copied this file. It has two `var(--font-manrope)`
references in inline styles for the font preview.

**Changes:**

1. Replace `var(--font-manrope), 'Manrope', sans-serif` with `previewFontFamily` from config
2. Add import for `useDevLensConfig`
3. Fix imports from `./` to `../core/` paths:
   - `./modular-scale` → `../core/modular-scale`
   - `./InspectorSwitch` → `./InspectorSwitch` (same directory, OK)

**Add import at top:**
```typescript
import { useDevLensConfig } from '../hooks/use-devlens-config';
```

**Inside the component function body, add:**
```typescript
const { previewFontFamily } = useDevLensConfig();
```

**Find ALL inline style references to `var(--font-manrope)`.** There are two:

1. In the scale baseline toggle area (a `<span>` inside the toggle div):
   — This is NOT a font-family reference, skip it if it doesn't have fontFamily.

2. In the preview panel, the `.te-scale-sample` span:
```typescript
fontFamily: "var(--font-manrope), 'Manrope', sans-serif",
```
**Replace with:**
```typescript
fontFamily: previewFontFamily,
```

Search the entire file for `font-manrope` and `Manrope` to catch all occurrences.

**Also check the `ScaleMetadata` interface.** If it's defined in both this file
AND `use-token-editor.ts`, remove it from this file and import from the hook:

```typescript
import type { ScaleMetadata } from '../hooks/use-token-editor';
```

---

## File 5: src/components/TokenEditorDrawer.tsx → RENAME to DevLensDrawer.tsx

**AK12 source reference:** `/Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/TokenEditorDrawer.tsx`

**Two actions: RENAME the file and REWRITE the content.**

### Step 1: Rename

```bash
mv src/components/TokenEditorDrawer.tsx src/components/DevLensDrawer.tsx
```

### Step 2: Rewrite

**Changes:**

1. Replace `var(--font-manrope)` references with `previewFontFamily` from config
2. Fix all `./` imports to correct relative paths
3. Update the component export name to `DevLensDrawer`

**Fix imports (find → replace):**

```typescript
// FROM:
import { useTokenEditor } from './use-token-editor';
import { useDockPosition, type DockPosition } from './use-dock-position';
import { useDetachedWindow } from './use-detached-window';
import { TokenEditorControls } from './TokenEditorControls';
import { TokenCreationZone } from './TokenCreationZone';
import { TokenEditorDiffOutput } from './TokenEditorDiffOutput';
import { useElementInspector } from './use-element-inspector';
import { useScaleBaseline } from './use-scale-baseline';
import { ElementInspectorTab } from './ElementInspectorTab';

// TO:
import { useTokenEditor } from '../hooks/use-token-editor';
import { useDockPosition, type DockPosition } from '../hooks/use-dock-position';
import { useDetachedWindow } from '../hooks/use-detached-window';
import { useElementInspector } from '../hooks/use-element-inspector';
import { useScaleBaseline } from '../hooks/use-scale-baseline';
import { useDevLensConfig } from '../hooks/use-devlens-config';
import { TokenEditorControls } from './TokenEditorControls';
import { TokenCreationZone } from './TokenCreationZone';
import { TokenEditorDiffOutput } from './TokenEditorDiffOutput';
import { ElementInspectorTab } from './ElementInspectorTab';
```

**Add config usage inside the component:**
```typescript
const { previewFontFamily } = useDevLensConfig();
```

**Find ALL `var(--font-manrope)` and `Manrope` references in inline styles.**
There is one in the trigger button and one in the `drawerStyle` `fontFamily`:

In `drawerStyle` useMemo:
```typescript
fontFamily:
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
```
This is the panel UI font — NOT the preview font. Leave it as-is. It's the
DevLens panel's own font stack, independent of the consumer's project font.

In the trigger button style:
```typescript
fontFamily:
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
```
Same — panel UI font. Leave as-is.

Search specifically for `font-manrope` — if there are references in the `<style>`
tag's CSS, those should also be replaced. The inline `<style>` block has:
```css
.te-scale-sample {
  ...
  font-family: var(--font-manrope), 'Manrope', sans-serif;
  ...
}
```

Wait — that style is actually in the `ModularScaleControl.tsx` inline styles,
not in the `<style>` block. Double-check the `<style>` block in
`TokenEditorDrawer.tsx` for any `manrope` or `font-manrope` references. If found,
replace with a CSS custom property that the component sets:

**Option:** Add a CSS variable to the drawer's root:
```typescript
// In drawerStyle:
'--devlens-preview-font': previewFontFamily,
```

Then in the `<style>` block, any `.te-scale-sample` rules use:
```css
font-family: var(--devlens-preview-font, inherit);
```

This approach keeps CSS and JS in sync without prop drilling through every
component. `ModularScaleControl.tsx` can also use this variable instead of
the config hook for its inline styles.

**Rename the component export:**
```typescript
// FROM:
export function TokenEditorDrawer() {
// TO:
export function DevLensDrawer() {
```

### Step 3: Update references to the old name

After renaming, grep for `TokenEditorDrawer` across the entire `src/` directory:
```bash
grep -rn "TokenEditorDrawer" src/
```

Update any imports (likely in `DevLens.tsx` or `index.ts`):
```typescript
// FROM:
import { TokenEditorDrawer } from './components/TokenEditorDrawer';
// TO:
import { DevLensDrawer } from './components/DevLensDrawer';
```

---

## File 6: src/core/cc-prompt-generator.ts (REWRITE)

**AK12 source reference:** `/Users/dorenberge/WorkInProgress/VIBE/AK12-MVP-v2/src/components/dev/token-editor/cc-prompt-generator.ts`

**Current state in Dev_Lens:** CC02 copied this file with a PENDING marker.
It contains AK12-specific file path references in the generated markdown
template strings.

**Changes:**

1. Replace AK12-specific paths with generic placeholders
2. Make path references configurable via function parameters
3. Remove PENDING comment if present

**Find all path references in template strings.** The AK12 version references:
- `src/app/globals.css` — generic, keep as-is (standard Next.js convention)
- `src/components/dev/token-editor/token-registry.ts` — replace with generic

**In the `generateCCPrompt()` function, find:**
```typescript
lines.push('3. Add to `src/components/dev/token-editor/token-registry.ts` `TOKEN_OVERRIDES`:');
```

**Replace with:**
```typescript
lines.push('3. Register in your DevLens config\'s `tokenOverrides`:');
```

**Update the code block after step 3.** Instead of generating TypeScript for
`TOKEN_OVERRIDES`, generate a config object entry:

```typescript
// Instead of the old TOKEN_OVERRIDES format:
lines.push('```typescript');
lines.push('// In your DevLens config:');
lines.push('tokenOverrides: {');
for (const prop of config.properties) {
  lines.push(`  '--${config.tokenName}-${prop.property}': {`);
  lines.push(`    label: '${kebabToTitle(config.tokenName)} ${kebabToTitle(prop.property)}',`);
  lines.push(`    group: 'Typography Scale',`);
  lines.push(`  },`);
}
lines.push('}');
lines.push('```');
```

**Also check for references to `@theme inline` block** — this is Tailwind v4
specific and fine to keep as a generic instruction.

**Remove the PENDING comment** at the top of the file if present.

---

## Post-Completion Checks

After all six files are updated, run these verification commands:

```bash
# No AK12 references anywhere
grep -rn "ak12\|AK12" src/

# No hardcoded font-manrope references
grep -rn "font-manrope\|Manrope" src/

# No old token-editor prefixed localStorage/channel names
grep -rn "'ak12-token-editor" src/

# No PENDING comments (except TokenEditorControls for CC06 accordion)
grep -rn "PENDING" src/

# No broken @/ imports
grep -rn "from '@/" src/
```

All should return zero results (except the one expected PENDING in
`TokenEditorControls.tsx` for the accordion swap in CC06).

---

## Verification Checklist

**use-token-editor.ts:**
- [ ] No `CHANNEL_NAME = 'ak12-token-editor'` constant
- [ ] BroadcastChannel name derived from `namespace` config
- [ ] `buildRegistry()` called with `tokenOverrides` from config
- [ ] Imports use relative paths (`../core/token-registry`, `../core/auto-detect`)

**use-dock-position.ts:**
- [ ] No `ak12-token-editor-dock` or `ak12-token-editor-open` hardcoded keys
- [ ] localStorage keys derived from `namespace` config
- [ ] `useDevLensConfig()` imported and used

**use-detached-window.ts:**
- [ ] No `'ak12-token-editor'` window name
- [ ] No `'/dev/token-editor-detached'` hardcoded route
- [ ] Window name and route from `namespace` and `detachedRoute` config

**ModularScaleControl.tsx:**
- [ ] No `var(--font-manrope)` or `'Manrope'` in styles
- [ ] Preview font from `previewFontFamily` config (or `--devlens-preview-font` CSS var)
- [ ] `ScaleMetadata` not duplicated — imported from `use-token-editor` if defined there
- [ ] Imports use correct relative paths (`../core/modular-scale`)

**DevLensDrawer.tsx (renamed from TokenEditorDrawer.tsx):**
- [ ] File renamed to `DevLensDrawer.tsx`
- [ ] Component export renamed to `DevLensDrawer`
- [ ] No `var(--font-manrope)` references
- [ ] `--devlens-preview-font` CSS variable set on drawer root
- [ ] All imports use correct relative paths to `../hooks/` and `./`
- [ ] All references to `TokenEditorDrawer` updated across codebase

**cc-prompt-generator.ts:**
- [ ] No AK12-specific file paths in template strings
- [ ] Step 3 references DevLens config format (not `TOKEN_OVERRIDES`)
- [ ] No PENDING comment

**Global:**
- [ ] `grep -rn "ak12\|AK12" src/` returns zero results
- [ ] `grep -rn "font-manrope\|Manrope" src/` returns zero results
- [ ] `grep -rn "PENDING" src/` returns only the TokenEditorControls accordion reference (CC06)
- [ ] All imports use relative paths, no `@/` aliases
- [ ] `npx tsc --noEmit` — errors should only be from TokenEditorControls.tsx (shadcn accordion, CC06)
