# DL-CC06 — Internal Accordion + TokenEditorControls Swap

**Project:** DevLens standalone package extraction
**Package root:** /Users/dorenberge/WorkInProgress/VIBE/Dev_Lens
**Reference spec:** DL-Spec-01_Extraction-Plan.md (§6 Phase D — CC06)
**Depends on:** DL-CC01 through DL-CC05 complete

---

## Objective

Create a lightweight internal accordion component that replaces the shadcn/Radix
`Accordion` dependency, then update `TokenEditorControls.tsx` to use it. After
this prompt, the package has zero dependency on `@radix-ui/react-accordion` or
`@/components/ui/accordion`, and `npx tsc --noEmit` should pass with no errors.

**Files to create (1):**

| File | Action |
|------|--------|
| `src/components/Accordion.tsx` | CREATE — lightweight internal accordion |

**Files to update (2):**

| File | Change |
|------|--------|
| `src/components/TokenEditorControls.tsx` | Replace shadcn import with internal accordion |
| `src/components/DevLensDrawer.tsx` | Remove `!important` from accordion CSS overrides |

---

## File 1: src/components/Accordion.tsx (CREATE)

Build a minimal accordion matching the exact usage pattern in TokenEditorControls:

```tsx
<Accordion type="single" collapsible className="te-accordion">
  <AccordionItem value="groupName" className="te-accordion-item">
    <AccordionTrigger className="te-accordion-trigger">
      <span>Group Label</span>
    </AccordionTrigger>
    <AccordionContent className="te-accordion-content">
      {/* content */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Requirements

- `type="single"` with `collapsible` — only one item open at a time, clicking
  the open item closes it
- Each `AccordionItem` takes a `value` string prop
- `AccordionTrigger` renders a clickable header with a chevron that rotates
  when expanded
- `AccordionContent` renders children with a smooth height animation on
  expand/collapse
- All components accept `className` prop for the existing `te-` scoped styles
- Keyboard accessible: Enter/Space toggles, no focus trapping needed (these
  are not modal)
- Zero external dependencies — React state only

### Implementation approach

Use React state at the `Accordion` level to track which `value` is currently
open (or `null` if collapsed). Pass state down via React context.

**Do NOT use `<details>`/`<summary>`** — they don't support smooth height
animation and have inconsistent cross-browser behavior with the chevron icon.

### Target implementation

```tsx
'use client';

import React, { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// --- Context ---

interface AccordionContextValue {
  openValue: string | null;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue>({
  openValue: null,
  toggle: () => {},
});

// --- Accordion (root) ---

interface AccordionProps {
  /** Must be "single" — multi not supported */
  type?: 'single';
  /** Allow closing all items (clicking open item closes it) */
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Accordion({ collapsible = false, className, children }: AccordionProps) {
  const [openValue, setOpenValue] = useState<string | null>(null);

  const toggle = useCallback(
    (value: string) => {
      setOpenValue((prev) => {
        if (prev === value) {
          return collapsible ? null : prev;
        }
        return value;
      });
    },
    [collapsible]
  );

  return (
    <AccordionContext.Provider value={{ openValue, toggle }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
}

// --- AccordionItem ---

interface AccordionItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue>({
  value: '',
  isOpen: false,
});

export function AccordionItem({ value, className, children }: AccordionItemProps) {
  const { openValue } = useContext(AccordionContext);
  const isOpen = openValue === value;

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div className={className} data-state={isOpen ? 'open' : 'closed'}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// --- AccordionTrigger ---

interface AccordionTriggerProps {
  className?: string;
  children: React.ReactNode;
}

export function AccordionTrigger({ className, children }: AccordionTriggerProps) {
  const { toggle } = useContext(AccordionContext);
  const { value, isOpen } = useContext(AccordionItemContext);

  return (
    <button
      type="button"
      className={className}
      onClick={() => toggle(value)}
      aria-expanded={isOpen}
      data-state={isOpen ? 'open' : 'closed'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
      }}
    >
      {children}
      <ChevronDown
        size={14}
        style={{
          transition: 'transform 200ms ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0,
        }}
      />
    </button>
  );
}

// --- AccordionContent ---

interface AccordionContentProps {
  className?: string;
  children: React.ReactNode;
}

export function AccordionContent({ className, children }: AccordionContentProps) {
  const { isOpen } = useContext(AccordionItemContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | 'auto'>(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // Measure content height on next frame
      requestAnimationFrame(() => {
        if (contentRef.current) {
          setHeight(contentRef.current.scrollHeight);
        }
      });
    } else {
      // Collapse: set explicit height first, then 0 on next frame
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight);
        requestAnimationFrame(() => {
          setHeight(0);
        });
      }
    }
  }, [isOpen]);

  // After expand animation completes, switch to auto height
  // so content can resize dynamically
  const handleTransitionEnd = () => {
    if (isOpen) {
      setHeight('auto');
    } else {
      setVisible(false);
    }
  };

  return (
    <div
      ref={contentRef}
      className={className}
      data-state={isOpen ? 'open' : 'closed'}
      onTransitionEnd={handleTransitionEnd}
      style={{
        overflow: 'hidden',
        height: typeof height === 'number' ? `${height}px` : height,
        transition: height === 'auto' ? 'none' : 'height 200ms ease',
        // Keep in DOM but hidden when collapsed for measuring
        visibility: visible || isOpen ? 'visible' : 'hidden',
        position: !visible && !isOpen ? 'absolute' : 'relative',
      }}
    >
      {children}
    </div>
  );
}
```

### Key design decisions

1. **Chevron via lucide-react** — already a peer dep, consistent with the rest
   of DevLens. Rotates 180° on open with CSS transition.
2. **Height animation** — measures `scrollHeight` and animates between 0 and
   measured height. Switches to `height: auto` after expand completes so
   dynamic content (e.g. sliders, previews) can resize.
3. **`data-state` attributes** — matches shadcn/Radix convention so existing
   CSS selectors targeting `[data-state=open]` still work if any exist.
4. **No `aria-controls`/`id` wiring** — the accordion is inside a dev tool
   panel, not a public-facing page. Basic `aria-expanded` on the trigger is
   sufficient.
5. **Content stays in DOM** — hidden content uses `visibility: hidden` +
   `position: absolute` so it can be measured but doesn't affect layout.

---

## File 2: src/components/TokenEditorControls.tsx (UPDATE)

### Change 1: Replace the import

**Find:**
```typescript
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
```

**Replace with:**
```typescript
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './Accordion';
```

That's it — the JSX usage is identical. No other changes needed in this file.

---

## File 3: src/components/DevLensDrawer.tsx (UPDATE — CSS cleanup)

The existing `<style>` block has accordion overrides with `!important` flags
that were needed to fight shadcn/Radix default styles. With the internal
accordion, these are no longer needed.

### Remove `!important` from accordion CSS rules

**Find and replace these CSS rules in the `<style>` block:**

```css
/* Old — with !important overrides */
.te-accordion {
  border: none !important;
}

.te-accordion-item {
  border-color: #313244 !important;
}

.te-accordion-trigger {
  padding: 8px 4px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  color: #cdd6f4 !important;
  text-decoration: none !important;
  font-family: inherit !important;
}

.te-accordion-trigger:hover {
  text-decoration: none !important;
  color: #89b4fa !important;
}

.te-accordion-trigger svg {
  color: #6c7086 !important;
}

.te-accordion-content {
  font-size: 13px !important;
}
```

**Replace with:**

```css
/* Internal accordion — no !important needed */
.te-accordion {
  border: none;
}

.te-accordion-item {
  border-bottom: 1px solid #313244;
}

.te-accordion-item:last-child {
  border-bottom: none;
}

.te-accordion-trigger {
  padding: 8px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #cdd6f4;
  text-decoration: none;
  font-family: inherit;
}

.te-accordion-trigger:hover {
  text-decoration: none;
  color: #89b4fa;
}

.te-accordion-trigger svg {
  color: #6c7086;
}

.te-accordion-content {
  font-size: 13px;
}
```

Note the `te-accordion-item` change: the shadcn version applied borders via
Radix's built-in styling. The internal version needs explicit `border-bottom`
on each item with `:last-child` removing the final border.

---

## Post-Completion Checks

```bash
# No shadcn/Radix accordion imports anywhere
grep -rn "@/components/ui/accordion" src/
grep -rn "radix.*accordion" src/

# No remaining @/ imports at all
grep -rn "from '@/" src/

# No PENDING comments
grep -rn "PENDING" src/

# TypeScript compiles clean
npx tsc --noEmit
```

ALL should return zero results / pass clean.

---

## Verification Checklist

**Accordion.tsx:**
- [ ] File exists at `src/components/Accordion.tsx`
- [ ] Exports: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- [ ] `Accordion` accepts `type`, `collapsible`, `className`, `children`
- [ ] Single-item behavior: opening one closes the previously open one
- [ ] Collapsible behavior: clicking the open item closes it
- [ ] `AccordionTrigger` renders chevron icon that rotates on open/close
- [ ] `AccordionTrigger` has `aria-expanded` attribute
- [ ] `AccordionContent` animates height on expand/collapse
- [ ] All components accept `className` prop
- [ ] Zero external dependencies beyond React and lucide-react

**TokenEditorControls.tsx:**
- [ ] Import changed from `@/components/ui/accordion` to `./Accordion`
- [ ] No other changes to the file (JSX unchanged)
- [ ] No PENDING comments

**DevLensDrawer.tsx CSS:**
- [ ] All `!important` flags removed from `.te-accordion-*` rules
- [ ] `.te-accordion-item` has `border-bottom: 1px solid #313244`
- [ ] `.te-accordion-item:last-child` has `border-bottom: none`

**Global:**
- [ ] `grep -rn "@/components" src/` returns zero results
- [ ] `grep -rn "radix" src/` returns zero results
- [ ] `grep -rn "PENDING" src/` returns zero results
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] No new external dependencies added to `package.json`
