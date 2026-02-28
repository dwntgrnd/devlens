# DevLens

**Live design token editor and element inspector for Next.js + Tailwind CSS projects.**

DevLens is a developer tool that appears as a floating panel inside your running application — similar to how Chrome DevTools' Elements panel lets you inspect and edit styles, except DevLens is purpose-built for design tokens. It's not a browser extension or a separate application. It's a React component you add to your layout that renders only during development and adds nothing to your production bundle.

When you open the panel, DevLens scans your document for CSS custom properties and presents each one with a visual control matched to its type. Color tokens get HSL color pickers with hue, saturation, and lightness sliders. Spacing and font-size tokens get numeric inputs with unit support. Shadow tokens get structured editors for offset, blur, spread, and color. You adjust a control, and the change is immediately visible in your actual application behind the panel — your real components, your real layout, responding in real time.

Changes made in DevLens are temporary — a hard refresh resets everything. But unlike the Chrome inspector, where style edits are lost the moment you navigate to another page, DevLens changes persist as you move through your application. Adjust your color tokens and spacing on the homepage, then click through to an inner page — your changes are still applied, because DevLens edits the underlying CSS custom properties that all your pages share. You can see how a single token adjustment affects your entire application without re-applying anything. When you're ready to make the changes permanent, DevLens generates two kinds of output. A **CSS diff** showing exactly which custom properties changed and their new values, ready to paste into your stylesheet. And a **structured prompt** formatted for Claude Code or any LLM, describing the changes in a way that an AI coding assistant can apply directly to your codebase. One visual editing session replaces multiple rounds of "make the heading smaller" → wait for build → "no, smaller than that" → wait again.

If you're building with AI-assisted development tools, DevLens sits at the point where design intent meets code. Instead of describing visual changes in words and hoping the LLM interprets them correctly, you make the changes yourself — visually, against your real components — and hand off the precise result. It also reduces round-trips to Figma for the kind of fine-tuning that happens during development: "this card shadow is too heavy," "the border radius feels off," "the muted text needs more contrast." You resolve it in the browser, generate the prompt, and move on.

## Features

- **Token auto-detection** — Scans `:root` CSS custom properties and presents type-appropriate controls (HSL color pickers, length inputs with unit support, shadow editors, font-size sliders)
- **Modular scale control** — Adjust all typography tokens proportionally using a modular scale ratio with live preview
- **Element inspector** — Select any DOM element to view and edit its CSS classes, see computed styles, and get migration suggestions for hardcoded values
- **Class editing** — Add, remove, and replace CSS classes on any element with autocomplete, conflict detection, and category grouping
- **Typography audit** — Compare your heading hierarchy against a configured scale baseline to catch inconsistencies
- **Token migration suggestions** — Flag hardcoded Tailwind classes (e.g., `text-gray-900`) and suggest semantic token replacements (e.g., `text-foreground`)
- **Diff output** — View all changes as a CSS diff, ready to copy into your stylesheet
- **Claude Code prompt generation** — Export changes as structured prompts formatted for LLM-assisted development
- **Token creation** — Define new CSS custom properties with generated prompts for adding them to your codebase
- **Detached window** — Pop the panel out to a separate browser window for dual-monitor workflows, synced in real time via BroadcastChannel
- **Dock positions** — Attach the panel to the left, right, or bottom of the viewport
- **Raw CSS input** — Apply arbitrary CSS to any selected element for quick experimentation
- **Fully scoped styles** — All DevLens UI uses `te-` prefixed CSS classes that will not interfere with your application

## Installation

### Prerequisites

- A **Next.js** project (version 13 or later) using the App Router
- **Tailwind CSS** with your design tokens defined as CSS custom properties in your global stylesheet (e.g., `globals.css`)
- **Node.js** and **npm** (or yarn/pnpm)

If your project already runs with `npm run dev`, you're ready.

### Install the package

```bash
npm install @dwntgrnd/devlens
```

DevLens expects these packages in your project. If you're using Next.js with Tailwind, you almost certainly have them already:

- `react` >= 18.0.0
- `react-dom` >= 18.0.0
- `next` >= 13.0.0
- `lucide-react` >= 0.300.0

If you don't have `lucide-react`:

```bash
npm install lucide-react
```

### Add DevLens to your layout

This requires two steps: creating a new file, then making a small edit to your existing layout.

**Step 1: Create a new file** at `app/providers.tsx`

This is a new file — create it in your `app/` directory alongside your existing `layout.tsx`. Copy the entire contents below:

```tsx
// app/providers.tsx
'use client';
import { DevLens } from '@dwntgrnd/devlens';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && <DevLens />}
    </>
  );
}
```

**Step 2: Edit your existing `app/layout.tsx`**

Do **not** replace the file. Make two changes to what's already there:

1. **Add this import** at the top of the file, with your other imports:

```tsx
import { Providers } from './providers';
```

2. **Wrap `{children}` with `<Providers>`** inside the `<body>` tag. Find the line that says `{children}` and change it:

```diff
  <body>
-   {children}
+   <Providers>{children}</Providers>
  </body>
```

Leave everything else in `layout.tsx` as-is — your fonts, metadata, className attributes, and other imports all stay.

The `process.env.NODE_ENV` check in `providers.tsx` ensures DevLens only renders during development. It will never appear in your production build.

### Verify it's working

Start your dev server:

```bash
npm run dev
```

You should see a small floating button in the bottom-right corner of your application. Click it to open the DevLens panel. If your global stylesheet defines CSS custom properties on `:root`, they'll appear in the panel with editing controls.

## What You'll See

The DevLens panel has three main areas:

**Token Editor** — The default tab. Lists every CSS custom property detected on your document's `:root` element, organized by group (colors, typography, spacing, shadows, etc.). Each token has a visual control appropriate to its type. Editing a token updates the live page immediately. At the top, a modular scale control lets you adjust all typography tokens proportionally.

**Element Inspector** — Switch to this tab (or use the inspector toggle) to click any element in your application and see its CSS classes, computed styles, and any migration suggestions. You can add, remove, or replace classes directly, with autocomplete and conflict detection.

**Output** — The Diff tab shows every change you've made as a CSS diff. The CC Prompt tab generates a structured prompt describing your changes, formatted for Claude Code or any LLM. Copy either output to apply your changes permanently.

The panel can be docked to the left, right, or bottom edge of the viewport, or detached into a separate browser window for dual-monitor setups.

## Configuration

DevLens works with zero configuration. It auto-detects your CSS custom properties and provides sensible defaults. For project-specific customization, you can optionally configure token labels, grouping, migration suggestions, and more.

### Zero config (just use it)

The Quick Start example above is all you need. DevLens will find your tokens automatically.

### Adding token labels and grouping

If you want human-readable names for your tokens or want to organize them into custom groups, create a configuration file:

```tsx
// devlens.config.ts
import type { DevLensConfig } from '@dwntgrnd/devlens';

export const devlensConfig: DevLensConfig = {
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
};
```

Then pass the config to DevLens in your layout:

```tsx
// app/providers.tsx
'use client';
import { DevLens } from '@dwntgrnd/devlens';
import { devlensConfig } from '../devlens.config';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && <DevLens {...devlensConfig} />}
    </>
  );
}
```

### Adding migration suggestions

If your project has hardcoded Tailwind utility classes that should be replaced with semantic tokens, add a migration map. DevLens will flag these classes when you inspect elements and suggest replacements:

```tsx
// devlens.config.ts
export const devlensConfig: DevLensConfig = {
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
};
```

### Isolating multiple DevLens instances

If you work on multiple projects simultaneously or want to keep DevLens state separate between apps, set a namespace:

```tsx
export const devlensConfig: DevLensConfig = {
  namespace: 'my-app',
};
```

This prefixes all localStorage keys and BroadcastChannel names so different projects don't interfere with each other.

### Full configuration reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tokenOverrides` | `Record<string, TokenOverride>` | `{}` | Labels, grouping, hints, and visibility for auto-detected tokens |
| `tokenGroups` | `string[]` | `[]` | Additional token group names beyond built-in defaults |
| `scaleBaseline` | `ScaleBaselineConfig` | `null` | Scale baseline mappings for typography audit (element → expected token) |
| `migrationMap` | `Record<string, MigrationEntry>` | Generic Tailwind map | Class migration suggestions (hardcoded → semantic) |
| `projectTextSizeClasses` | `string[]` | `[]` | Additional text size classes for typography detection |
| `namespace` | `string` | `'devlens'` | Namespace for localStorage keys and BroadcastChannel isolation |
| `detachedRoute` | `string` | `'/dev/devlens-detached'` | Route path for detached window |
| `previewFontFamily` | `string` | `'inherit'` | Font family used in typography preview |
| `forceEnable` | `boolean` | `false` | Render DevLens outside of `development` environment |

### Type reference

<details>
<summary>TokenOverride</summary>

```typescript
interface TokenOverride {
  label?: string;           // Human-readable name shown in the panel
  group?: string;           // Group heading (tokens with the same group are listed together)
  type?: TokenType;         // Force a control type: 'hsl-color' | 'length' | 'shadow' | 'font-size' | 'other'
  hint?: string;            // Tooltip shown on hover
  usedBy?: string[];        // Component names that reference this token (informational)
  hidden?: boolean;         // Hide this token from the panel
  managedByScale?: boolean; // Indicate this token is controlled by the modular scale
}
```

</details>

<details>
<summary>MigrationEntry</summary>

```typescript
interface MigrationEntry {
  replacement: string;              // Suggested replacement class
  reason?: string;                  // Explanation shown to the user
  confidence?: 'high' | 'medium';  // Confidence indicator
}
```

</details>

<details>
<summary>ScaleBaselineConfig</summary>

```typescript
interface ScaleBaselineConfig {
  mapping: ScaleBaselineMapping[];
}

interface ScaleBaselineMapping {
  selector: string;        // CSS selector — 'h1', 'h2', 'p'
  fontSizeVar: string;     // CSS variable — '--font-size-page-title'
  lineHeightVar: string;   // CSS variable — '--line-height-page-title'
  fontWeight?: number;     // Font weight (omit to inherit)
  scaleLabel: string;      // Human-readable label for this scale step
}
```

</details>

## Detached Window

DevLens can pop out to a separate browser window for dual-monitor workflows. This is useful when you want the editing panel on one screen and your application on another. The main app and detached panel stay synced in real time — changes you make in either window are immediately reflected in the other.

To enable this, add a page route for the detached window:

```tsx
// app/dev/devlens-detached/page.tsx
import { DevLens } from '@dwntgrnd/devlens';
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

Note: `forceEnable` is needed here because this page runs outside your main layout. The `detachedRoute` config prop should match this file's route path (the default is `/dev/devlens-detached`).

Click the detach icon in the DevLens panel header to open the separate window.

## How It Works

DevLens runs entirely in the browser. It does not start a server, modify your files, or access your filesystem.

On mount, it reads all CSS custom properties from the document's `:root` element using `getComputedStyle`. It infers each token's type from its value (HSL colors, pixel/rem lengths, box-shadow syntax) and renders the appropriate editing control. When you adjust a control, DevLens calls `document.documentElement.style.setProperty()` to update the value — the browser re-renders immediately, and your actual components respond because they reference those same custom properties.

All DevLens UI is styled with `te-` prefixed CSS classes loaded from a single scoped stylesheet (`devlens.css`). There's no CSS-in-JS runtime, no global style injection, and no risk of interfering with your application's styles.

The detached window feature uses the browser's `BroadcastChannel` API to synchronize state between the main window and the detached panel. Both instances share the same namespace and listen for change events.

## Roadmap

- **Direct file writes** — A companion dev server process that writes CSS changes directly to your stylesheet, eliminating the copy-paste step. This is a well-understood architecture (WebSocket bridge between browser UI and a Node.js file-writing process) and is planned for a future release.
- **Non-Next.js React support** — Remove the `next/dynamic` dependency to support Vite, Remix, and other React frameworks.
- **VS Code / Cursor extension** — Surface token editing directly in the editor sidebar.
- **Component mapping** — Identify which components consume which tokens for targeted editing.

## Example App

A complete working example lives in [`examples/next-app/`](./examples/next-app/). To run it:

```bash
cd examples/next-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The example demonstrates zero-config auto-detection, token overrides with custom labels, migration suggestions, and the detached window route.

## License

MIT — see [LICENSE](./LICENSE) for details.
