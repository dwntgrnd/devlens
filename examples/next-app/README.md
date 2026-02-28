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
