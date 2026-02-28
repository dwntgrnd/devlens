# DL-CC08 — Wire DevLens Entry Component

**Phase:** F — Wire Entry Point  
**Depends on:** CC07 (CSS extracted to devlens.css)  
**Session:** DL-S04

---

## Objective

Transform `DevLens.tsx` from a placeholder into the functional public entry component. It wraps `DevLensProvider` + `DevLensDrawer` with `next/dynamic` for SSR safety, imports the CSS file, and accepts all `DevLensConfig` props.

---

## Tasks

### 1. Rewrite `src/DevLens.tsx`

Replace the current placeholder with a fully wired entry component:

```tsx
'use client';

import dynamic from 'next/dynamic';
import { DevLensProvider } from './DevLensProvider';
import type { DevLensConfig } from './config/types';
import './styles/devlens.css';

const DevLensDrawer = dynamic(
  () => import('./components/DevLensDrawer').then((m) => ({ default: m.DevLensDrawer })),
  { ssr: false },
);

export interface DevLensProps extends DevLensConfig {
  /** Force enable outside dev mode (default: false) */
  forceEnable?: boolean;
}

export function DevLens({ forceEnable, ...config }: DevLensProps) {
  if (!forceEnable && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <DevLensProvider {...config}>
      <DevLensDrawer />
    </DevLensProvider>
  );
}
```

Key points:
- **CSS import** at the top level — this is the single import point for all DevLens styles
- **`next/dynamic` with `ssr: false`** — DevLensDrawer manipulates the DOM (body margins, overlay elements, BroadcastChannel, localStorage). SSR would break.
- **Named export extraction** — `DevLensDrawer` is a named export, so the dynamic import uses `.then((m) => ({ default: m.DevLensDrawer }))` to satisfy `next/dynamic`'s default export requirement
- **Props destructuring** — `forceEnable` is consumed here; remaining config props pass through to `DevLensProvider`
- **Dev-only gate** — `process.env.NODE_ENV` check with `forceEnable` escape hatch

### 2. Verify `src/index.ts` exports

The current exports should already be correct. Verify that `index.ts` exports:
- `DevLens` component
- `DevLensProvider` component  
- `useDevLensConfig` hook
- `DevLensProps` type
- `DevLensConfig` type
- All sub-types (`TokenType`, `TokenOverride`, `ScaleBaselineMapping`, `ScaleBaselineConfig`, `MigrationEntry`)

No changes should be needed. If any are missing, add them.

### 3. Verify `DevLensDrawer.tsx` is a named export

The dynamic import expects `DevLensDrawer` as a named export. Confirm the component file uses:
```tsx
export function DevLensDrawer() {
```
Not a default export. If it's already a named export (which it should be from CC06), no change needed.

---

## What NOT to Do

- Do NOT add `ElementSelectorOverlay` mounting here — it's already rendered inside `DevLensDrawer` via `ElementInspectorTab`
- Do NOT add any `useEffect` for body styles — `DevLensDrawer` handles that internally
- Do NOT add a separate CSS file import in `DevLensDrawer.tsx` — the entry component owns the CSS import

---

## Verification Checklist

- [ ] `DevLens.tsx` imports and renders `DevLensProvider` wrapping dynamically-imported `DevLensDrawer`
- [ ] `DevLens.tsx` imports `./styles/devlens.css`
- [ ] `next/dynamic` used with `{ ssr: false }`
- [ ] Dev-only gate works: returns `null` when `NODE_ENV !== 'development'` and `forceEnable` is falsy
- [ ] `forceEnable` prop correctly bypasses the dev gate
- [ ] Config props pass through to `DevLensProvider`
- [ ] `index.ts` exports are complete (no missing types or components)
- [ ] `npx tsc --noEmit` passes clean
- [ ] Commit with message: `feat: wire DevLens entry component with dynamic import (DL-CC08)`
