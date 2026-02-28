# DL-CC07 — Extract Inline Styles to devlens.css

**Phase:** E — Extract Styles  
**Depends on:** CC06 (internal accordion complete)  
**Session:** DL-S04

---

## Objective

Move all inline `<style>` content from `DevLensDrawer.tsx` into `src/styles/devlens.css`. Also convert the trigger button's inline styles to CSS classes. After this prompt, DevLensDrawer renders zero `<style>` tags and zero inline `style={}` objects — all styling lives in the external CSS file.

---

## Tasks

### 1. Create `src/styles/devlens.css`

- Delete `src/styles/.gitkeep`
- Create `src/styles/devlens.css` containing the full contents of the `<style>{`...`}</style>` block currently at the bottom of `DevLensDrawer.tsx`
- Add a file header comment:

```css
/*
 * DevLens — scoped panel styles
 * All classes use the `te-` prefix to avoid collisions with consumer apps.
 * This file is imported by the DevLens entry component (DevLens.tsx).
 */
```

### 2. Convert trigger button inline styles to CSS classes

The trigger button (rendered when `!isOpen && !isDetached`) currently uses inline `style={}` objects. Convert these to CSS classes in `devlens.css`:

**Trigger button container** — add class `te-trigger` (already referenced but not defined):
```css
.te-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9998;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #1e1e2e;
  color: #cdd6f4;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
```

**Scale baseline indicator dot** — create class `te-trigger-dot-baseline`:
```css
.te-trigger-dot-baseline {
  position: absolute;
  top: -2px;
  left: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a6e3a1;
}
```

**Change count badge** — create class `te-trigger-badge`:
```css
.te-trigger-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #f38ba8;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1e1e2e;
}
```

### 3. Update `DevLensDrawer.tsx`

**Remove the entire `<style>{`...`}</style>` block** from the JSX return. It's the last element before the closing `</>`.

**Replace trigger button inline styles with CSS classes:**

Before (inline styles):
```tsx
<button
  type="button"
  onClick={() => setIsOpen(true)}
  className="te-trigger"
  title="Open DevLens"
  style={{
    position: 'fixed',
    bottom: 20,
    right: 20,
    // ... all inline styles
  }}
>
```

After (class-only):
```tsx
<button
  type="button"
  onClick={() => setIsOpen(true)}
  className="te-trigger"
  title="Open DevLens"
>
```

**Replace scale baseline dot inline styles:**

Before:
```tsx
<span
  style={{
    position: 'absolute',
    top: -2,
    left: -2,
    // ...
  }}
/>
```

After:
```tsx
<span className="te-trigger-dot-baseline" />
```

**Replace change count badge inline styles:**

Before:
```tsx
<span
  style={{
    position: 'absolute',
    top: -2,
    right: -2,
    // ...
  }}
>
```

After:
```tsx
<span className="te-trigger-badge">
```

**Keep the `drawerStyle` useMemo as-is.** The drawer's positional styles (`top`, `left`, `right`, `bottom`, `width`, `height`) are computed dynamically based on dock position and open state. These remain as inline styles because they change at runtime. The `--devlens-preview-font` CSS custom property also stays inline since it's set from config context.

### 4. Do NOT add a CSS import to DevLensDrawer.tsx

The CSS import will be added in CC08 when we wire the entry component (`DevLens.tsx`). DevLensDrawer does not import its own styles — the entry component owns that responsibility.

---

## Verification Checklist

- [ ] `src/styles/devlens.css` exists with all styles from the former `<style>` block plus the three new trigger classes
- [ ] `src/styles/.gitkeep` is deleted
- [ ] `DevLensDrawer.tsx` contains zero `<style>` tags
- [ ] `DevLensDrawer.tsx` trigger button has zero `style={}` props — uses `te-trigger`, `te-trigger-dot-baseline`, and `te-trigger-badge` classes
- [ ] `DevLensDrawer.tsx` still has `drawerStyle` useMemo with inline positional styles (this is correct — do not extract)
- [ ] `npx tsc --noEmit` passes clean
- [ ] No new imports added to `DevLensDrawer.tsx` (no CSS import here)
- [ ] File header comment present in `devlens.css`
- [ ] Commit with message: `feat: extract inline styles to devlens.css (DL-CC07)`
