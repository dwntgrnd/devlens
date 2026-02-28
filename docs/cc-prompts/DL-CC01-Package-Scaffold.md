# DL-CC01 — Package Scaffold

**Project:** DevLens standalone package extraction
**Package root:** /Users/dorenberge/WorkInProgress/VIBE/Dev_Lens
**Reference spec:** DL-Spec-01_Extraction-Plan.md (§4 Config API, §5 Package Structure)

---

## Objective

Create the DevLens package directory structure, configuration files, and the
foundational config/provider layer. This is the skeleton that all subsequent
prompts build on.

---

## 1. Create directory structure

```
Dev_Lens/
├── docs/
│   └── cc-prompts/           # Future CC prompt storage
├── src/
│   ├── index.ts
│   ├── DevLens.tsx            # Placeholder — wired in DL-CC08
│   ├── DevLensProvider.tsx
│   ├── config/
│   │   ├── types.ts
│   │   ├── defaults.ts
│   │   ├── token-groups.ts
│   │   └── migration-defaults.ts
│   ├── core/                  # Populated in DL-CC02/CC03
│   ├── hooks/
│   │   └── use-devlens-config.ts
│   ├── components/            # Populated in DL-CC02/CC04/CC06
│   └── styles/                # Populated in DL-CC07
├── examples/                  # Populated in DL-CC09
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md                  # Placeholder — written in DL-CC10
```

## 2. package.json

```json
{
  "name": "devlens",
  "version": "0.1.0",
  "description": "Visual design token editor and element inspector for Next.js + Tailwind CSS projects",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/devlens.css"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "next": ">=13.0.0",
    "lucide-react": ">=0.300.0"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tsup": "^8",
    "typescript": "^5",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "lucide-react": "^0.563.0"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": ""
  },
  "keywords": ["design-tokens", "tailwind", "css-variables", "devtools", "next.js"]
}
```

## 3. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "examples"]
}
```

## 4. LICENSE (MIT)

Standard MIT license. Author: Doren Berge. Year: 2026.

## 5. src/config/types.ts

All public TypeScript interfaces for the package. Copy these exactly:

```typescript
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
```

## 6. src/config/defaults.ts

```typescript
import type { DevLensConfig } from './types';

export const DEFAULT_CONFIG: Required<DevLensConfig> = {
  tokenOverrides: {},
  tokenGroups: [],
  scaleBaseline: { mapping: [] },
  migrationMap: {},
  projectTextSizeClasses: [],
  namespace: 'devlens',
  detachedRoute: '/dev/devlens-detached',
  previewFontFamily: 'inherit',
};
```

## 7. src/config/token-groups.ts

Copy `TOKEN_GROUPS` from AK12 source (`token-registry.ts`) as-is — these are generic, not AK12-specific:

```typescript
export const TOKEN_GROUPS = [
  'Brand Colors',
  'Semantic Colors',
  'Surfaces',
  'Text Colors',
  'Borders',
  'Navigation',
  'Modular Type Scale',
  'Typography Scale',
  'Spacing & Layout',
  'Shadows',
] as const;

export type TokenGroup = (typeof TOKEN_GROUPS)[number];
```

## 8. src/config/migration-defaults.ts

Generic Tailwind-to-semantic migrations only. No AK12-specific tokens:

```typescript
import type { MigrationEntry } from './types';

/**
 * Default migration suggestions: standard Tailwind hardcoded classes
 * to semantic CSS custom property equivalents.
 */
export const DEFAULT_MIGRATION_MAP: Record<string, MigrationEntry> = {
  'text-black': {
    replacement: 'text-foreground',
    reason: 'Use semantic foreground token for theme support',
  },
  'text-white': {
    replacement: 'text-background',
    reason: 'Use semantic background token for theme support',
  },
  'text-gray-900': {
    replacement: 'text-foreground',
    reason: 'Use semantic foreground token',
  },
  'text-gray-500': {
    replacement: 'text-muted-foreground',
    reason: 'Use semantic muted foreground token',
  },
  'bg-white': {
    replacement: 'bg-background',
    reason: 'Use semantic background token for theme support',
  },
  'bg-gray-100': {
    replacement: 'bg-muted',
    reason: 'Use semantic muted token',
  },
  'border-gray-200': {
    replacement: 'border-border',
    reason: 'Use semantic border token',
  },
  'border-gray-300': {
    replacement: 'border-input',
    reason: 'Use semantic input border token',
  },
};
```

## 9. src/DevLensProvider.tsx

```typescript
'use client';

import React, { createContext, useMemo } from 'react';
import type { DevLensConfig } from './config/types';
import { DEFAULT_CONFIG } from './config/defaults';

export interface DevLensContextValue extends Required<DevLensConfig> {}

export const DevLensContext = createContext<DevLensContextValue>(DEFAULT_CONFIG);

interface DevLensProviderProps extends DevLensConfig {
  children: React.ReactNode;
}

export function DevLensProvider({ children, ...config }: DevLensProviderProps) {
  const value = useMemo<DevLensContextValue>(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
      // Deep merge maps rather than replace
      tokenOverrides: { ...DEFAULT_CONFIG.tokenOverrides, ...config.tokenOverrides },
      migrationMap: { ...DEFAULT_CONFIG.migrationMap, ...config.migrationMap },
      tokenGroups: [
        ...DEFAULT_CONFIG.tokenGroups,
        ...(config.tokenGroups ?? []),
      ],
      projectTextSizeClasses: [
        ...DEFAULT_CONFIG.projectTextSizeClasses,
        ...(config.projectTextSizeClasses ?? []),
      ],
    }),
    [config]
  );

  return (
    <DevLensContext.Provider value={value}>
      {children}
    </DevLensContext.Provider>
  );
}
```

## 10. src/hooks/use-devlens-config.ts

```typescript
'use client';

import { useContext } from 'react';
import { DevLensContext } from '../DevLensProvider';
import type { DevLensContextValue } from '../DevLensProvider';

export function useDevLensConfig(): DevLensContextValue {
  return useContext(DevLensContext);
}
```

## 11. src/DevLens.tsx (placeholder)

```typescript
'use client';

import dynamic from 'next/dynamic';
import type { DevLensConfig } from './config/types';

// Placeholder — DevLensDrawer will be wired in DL-CC08
// For now, renders nothing to allow typecheck to pass

export interface DevLensProps extends DevLensConfig {
  /** Force enable outside dev mode (default: false) */
  forceEnable?: boolean;
}

export function DevLens(props: DevLensProps) {
  if (!props.forceEnable && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return null; // Wired in DL-CC08
}
```

## 12. src/index.ts

```typescript
// Public API
export { DevLens } from './DevLens';
export { DevLensProvider } from './DevLensProvider';
export { useDevLensConfig } from './hooks/use-devlens-config';

// Types
export type {
  DevLensConfig,
  DevLensProps,
} from './DevLens';

export type {
  TokenType,
  TokenOverride,
  ScaleBaselineMapping,
  ScaleBaselineConfig,
  MigrationEntry,
} from './config/types';
```

## 13. README.md (placeholder)

```markdown
# DevLens

Visual design token editor and element inspector for Next.js + Tailwind CSS projects.

> 🚧 Under active development. Full documentation coming in DL-CC10.

## Quick Start

\`\`\`tsx
import { DevLens } from 'devlens';

// In your layout.tsx
{process.env.NODE_ENV === 'development' && <DevLens />}
\`\`\`
```

---

## Verification Checklist

After execution, confirm:

- [ ] Directory structure matches §1 exactly (empty dirs for core/, components/, styles/, examples/)
- [ ] `package.json` has correct peer deps (react, react-dom, next, lucide-react)
- [ ] `tsconfig.json` compiles with `tsc --noEmit` (no errors)
- [ ] `config/types.ts` exports all interfaces: DevLensConfig, TokenOverride, TokenType, ScaleBaselineMapping, ScaleBaselineConfig, MigrationEntry
- [ ] `config/defaults.ts` exports DEFAULT_CONFIG with all required fields
- [ ] `config/token-groups.ts` exports TOKEN_GROUPS array
- [ ] `config/migration-defaults.ts` exports DEFAULT_MIGRATION_MAP
- [ ] `DevLensProvider.tsx` creates context with deep-merged config
- [ ] `hooks/use-devlens-config.ts` returns context value
- [ ] `DevLens.tsx` renders null (placeholder) and respects NODE_ENV
- [ ] `index.ts` re-exports all public types and components
- [ ] `npm install` succeeds
- [ ] No references to AK12, `@/`, or any AK12 import paths exist in any file
- [ ] `docs/cc-prompts/` directory exists
