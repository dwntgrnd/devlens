# DL-CC09 — Create Example Next.js App

**Phase:** G — Verify & Document  
**Depends on:** CC08 (entry component wired)  
**Session:** DL-S04

---

## Objective

Create a minimal Next.js + Tailwind CSS app in `examples/next-app/` that demonstrates DevLens integration. The example serves three purposes: verify the package works end-to-end, provide a reference implementation for consumers, and demonstrate both zero-config and customized usage.

---

## Tasks

### 1. Scaffold `examples/next-app/`

Delete `examples/.gitkeep`. Create a minimal Next.js app (App Router) with this structure:

```
examples/next-app/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── dev/
│   │       └── devlens-detached/
│   │           └── page.tsx
│   └── devlens.config.ts
└── README.md
```

### 2. `package.json`

```json
{
  "name": "devlens-example",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "lucide-react": "^0.460.0",
    "devlens": "file:../../"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4"
  }
}
```

Key: `"devlens": "file:../../"` links to the local package root so the example consumes the real package without publishing.

### 3. `tsconfig.json`

Standard Next.js tsconfig:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4. `next.config.ts`

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

### 5. Tailwind + PostCSS config

`tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

`postcss.config.mjs`:
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 6. `src/app/globals.css`

Minimal Tailwind setup with a few custom CSS variables for DevLens to detect:

```css
@import "tailwindcss";

:root {
  /* Brand colors — DevLens will auto-detect these */
  --color-primary: hsl(222, 47%, 40%);
  --color-primary-foreground: hsl(0, 0%, 100%);
  --color-secondary: hsl(210, 40%, 96%);
  --color-secondary-foreground: hsl(222, 47%, 11%);

  /* Surfaces */
  --color-background: hsl(0, 0%, 100%);
  --color-foreground: hsl(222, 47%, 11%);
  --color-muted: hsl(210, 40%, 96%);
  --color-muted-foreground: hsl(215, 16%, 47%);
  --color-border: hsl(214, 32%, 91%);

  /* Typography (font-size tokens for modular scale) */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
}
```

This gives DevLens a realistic set of tokens to detect — colors, font sizes, spacing, shadows, and radii.

### 7. `src/app/layout.tsx`

Demonstrates both zero-config and configured DevLens mounting:

```tsx
import type { Metadata } from 'next';
import { DevLens } from 'devlens';
import { devlensConfig } from '../devlens.config';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevLens Example',
  description: 'Example Next.js app with DevLens integration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* DevLens — with project-specific config */}
        {process.env.NODE_ENV === 'development' && (
          <DevLens {...devlensConfig} />
        )}
      </body>
    </html>
  );
}
```

### 8. `src/app/page.tsx`

A simple page with enough styled content for DevLens to be useful:

```tsx
export default function Home() {
  return (
    <main
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        padding: 'var(--spacing-xl)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 700,
          color: 'var(--color-foreground)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        DevLens Example
      </h1>
      <p
        style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-muted-foreground)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        This page uses CSS custom properties that DevLens auto-detects. Click the
        floating button in the bottom-right corner to open the panel.
      </p>

      {/* Sample cards using token-driven styles */}
      <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
        <div
          style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 600,
              color: 'var(--color-foreground)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Token Editing
          </h2>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-muted-foreground)' }}>
            Adjust colors, font sizes, spacing, and shadows in real time. Changes
            are reflected immediately and can be exported as CSS.
          </p>
        </div>

        <div
          style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 600,
              color: 'var(--color-foreground)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Element Inspector
          </h2>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-muted-foreground)' }}>
            Select any element to view and edit its CSS classes, add custom styles,
            and see migration suggestions for hardcoded values.
          </p>
        </div>

        <button
          style={{
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          Sample Button
        </button>
      </div>
    </main>
  );
}
```

Uses inline styles with CSS custom properties so DevLens token edits are immediately visible. No Tailwind utility classes on this page — keeps it simple and demonstrates token-driven styling.

### 9. `src/devlens.config.ts`

Example project configuration demonstrating consumer overrides:

```ts
import type { DevLensConfig } from 'devlens';

export const devlensConfig: DevLensConfig = {
  namespace: 'example-app',

  // Override labels for auto-detected tokens
  tokenOverrides: {
    '--color-primary': {
      label: 'Brand Primary',
      group: 'Brand Colors',
      hint: 'Main brand color used for CTAs and links',
    },
    '--color-primary-foreground': {
      label: 'Brand Primary Text',
      group: 'Brand Colors',
    },
    '--font-size-base': {
      label: 'Body Text',
      group: 'Typography',
      hint: 'Base font size (1rem = 16px)',
    },
  },

  // Example migration map — suggest token replacements for hardcoded values
  migrationMap: {
    'text-gray-900': {
      replacement: 'text-foreground',
      reason: 'Use semantic color token instead of fixed gray',
      confidence: 'high',
    },
    'bg-white': {
      replacement: 'bg-background',
      reason: 'Use semantic surface token for theme support',
      confidence: 'high',
    },
    'text-gray-500': {
      replacement: 'text-muted-foreground',
      reason: 'Use semantic muted text token',
      confidence: 'medium',
    },
  },

  detachedRoute: '/dev/devlens-detached',
};
```

### 10. `src/app/dev/devlens-detached/page.tsx`

Detached window route — a minimal page that mounts DevLens for the popup window. The BroadcastChannel syncs token changes between this window and the main window.

```tsx
import { DevLens } from 'devlens';
import { devlensConfig } from '../../../devlens.config';

export default function DevLensDetachedPage() {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <DevLens {...devlensConfig} forceEnable />
      </body>
    </html>
  );
}
```

Note: This page mounts a fresh `<DevLens />` instance. The popup auto-opens the drawer because the main window wrote `isOpen: true` to localStorage before detaching. Both windows share the same origin so localStorage and BroadcastChannel sync works automatically.

**Known limitation:** The main window calls `setIsOpen(false)` when detaching, which writes `false` to localStorage. The popup reads this on mount and starts closed. The user clicks the trigger button to open. This is functional but not ideal — a future enhancement (backlog B-05/B-06) could add a `defaultOpen` prop or detect the popup context. For now, this is acceptable for an example.

### 11. `examples/next-app/README.md`

```markdown
# DevLens Example — Next.js App

Minimal Next.js + Tailwind CSS app demonstrating DevLens integration.

## Setup

```bash
# From the DevLens package root
cd examples/next-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click the floating palette button to open DevLens.

## What's Demonstrated

- **Zero-config auto-detection**: DevLens finds all CSS custom properties on `:root`
- **Project configuration**: Token overrides, migration maps, and namespace in `devlens.config.ts`
- **Detached window**: Click the detach icon in the panel header to open DevLens in a popup
- **Token editing**: Adjust colors, fonts, spacing, and shadows with live preview
- **Element inspector**: Click elements to view and edit their CSS classes

## Files

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Mounts `<DevLens>` with project config |
| `src/devlens.config.ts` | Example project configuration |
| `src/app/page.tsx` | Sample page using CSS custom properties |
| `src/app/dev/devlens-detached/page.tsx` | Detached window route |
```

---

## What NOT to Do

- Do NOT run `npm install` or `npm run dev` — this prompt creates files only. Testing is manual.
- Do NOT modify any files in `src/` (the DevLens package source). This prompt only creates files in `examples/next-app/`.
- Do NOT add Tailwind utility classes to `page.tsx` — inline styles with CSS custom properties provide better DevLens demonstration (token changes are immediately visible).

---

## Verification Checklist

- [ ] `examples/.gitkeep` is deleted
- [ ] All files listed in the structure above are created
- [ ] `package.json` has `"devlens": "file:../../"` dependency
- [ ] `layout.tsx` mounts `<DevLens>` with config from `devlens.config.ts`
- [ ] `page.tsx` uses CSS custom properties (not Tailwind classes) for styling
- [ ] `globals.css` defines a realistic set of CSS custom properties across color, typography, spacing, shadow, and radius categories
- [ ] `devlens.config.ts` demonstrates `tokenOverrides`, `migrationMap`, and `namespace`
- [ ] `dev/devlens-detached/page.tsx` exists and mounts `<DevLens forceEnable />`
- [ ] `README.md` documents setup and what's demonstrated
- [ ] `npx tsc --noEmit` passes clean in the DevLens package root (no regressions)
- [ ] Commit with message: `feat: add example Next.js app (DL-CC09)`
