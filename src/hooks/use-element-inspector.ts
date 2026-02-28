'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

export interface ClassChange {
  type: 'added' | 'removed' | 'modified';
  original?: string;
  current?: string;
}

export interface ElementIdentifier {
  tagName: string;
  textPreview: string;
  breadcrumb: string[];
  testId?: string;
  id?: string;
}

export interface CustomStyleEntry {
  property: string;
  value: string;
}

interface InspectorState {
  isSelectorActive: boolean;
  selectedElement: HTMLElement | null;
  originalClasses: string[];
  currentClasses: string[];
  classChanges: ClassChange[];
  cachedIdentifier: ElementIdentifier | null;
  customStyles: CustomStyleEntry[];
  originalInlineStyles: Record<string, string>;
}

export function useElementInspector() {
  const [state, setState] = useState<InspectorState>({
    isSelectorActive: false,
    selectedElement: null,
    originalClasses: [],
    currentClasses: [],
    classChanges: [],
    cachedIdentifier: null,
    customStyles: [],
    originalInlineStyles: {},
  });

  // Use ref for element to avoid stale closure issues
  const elementRef = useRef<HTMLElement | null>(null);

  const toggleSelector = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSelectorActive: !prev.isSelectorActive,
    }));
  }, []);

  const activateSelector = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSelectorActive: true,
    }));
  }, []);

  const deactivateSelector = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSelectorActive: false,
    }));
  }, []);

  const computeIdentifier = useCallback((el: HTMLElement): ElementIdentifier => {
    const tagName = el.tagName.toLowerCase();
    const rawText = el.textContent || '';
    const textPreview =
      rawText.length > 60 ? rawText.slice(0, 60).trim() + '…' : rawText.trim();

    // Build breadcrumb — walk up 4-5 levels
    const breadcrumb: string[] = [];
    let current: HTMLElement | null = el;
    for (let i = 0; i < 5 && current; i++) {
      const tag = current.tagName.toLowerCase();
      const firstClass = Array.from(current.classList)
        .find((c) => !c.startsWith('te-'));
      const segment = firstClass ? `${tag}.${firstClass}` : tag;
      breadcrumb.unshift(segment);
      current = current.parentElement;
    }

    const testId = el.getAttribute('data-testid') || undefined;
    const id = el.id || undefined;

    return { tagName, textPreview, breadcrumb, testId, id };
  }, []);

  const selectElement = useCallback((el: HTMLElement) => {
    elementRef.current = el;
    const classes = Array.from(el.classList);
    const identifier = computeIdentifier(el);
    setState({
      isSelectorActive: false,
      selectedElement: el,
      originalClasses: [...classes],
      currentClasses: [...classes],
      classChanges: [],
      cachedIdentifier: identifier,
      customStyles: [],
      originalInlineStyles: {},
    });
  }, [computeIdentifier]);

  const clearSelection = useCallback(() => {
    elementRef.current = null;
    setState({
      isSelectorActive: false,
      selectedElement: null,
      originalClasses: [],
      currentClasses: [],
      classChanges: [],
      cachedIdentifier: null,
      customStyles: [],
      originalInlineStyles: {},
    });
  }, []);

  const addClass = useCallback((className: string) => {
    const el = elementRef.current;
    if (!el || !className.trim()) return;

    const cls = className.trim();
    el.classList.add(cls);

    setState((prev) => {
      // If it was originally there, no change needed
      if (prev.originalClasses.includes(cls)) {
        return {
          ...prev,
          currentClasses: Array.from(el.classList),
        };
      }

      // Check if already tracked as added
      const existing = prev.classChanges.find(
        (c) => c.type === 'added' && c.current === cls
      );
      if (existing) {
        return { ...prev, currentClasses: Array.from(el.classList) };
      }

      // Check if it was previously removed — becomes unmodified (remove the change)
      const removedIdx = prev.classChanges.findIndex(
        (c) => c.type === 'removed' && c.original === cls
      );
      if (removedIdx >= 0) {
        const newChanges = [...prev.classChanges];
        newChanges.splice(removedIdx, 1);
        return {
          ...prev,
          currentClasses: Array.from(el.classList),
          classChanges: newChanges,
        };
      }

      return {
        ...prev,
        currentClasses: Array.from(el.classList),
        classChanges: [
          ...prev.classChanges,
          { type: 'added', current: cls },
        ],
      };
    });
  }, []);

  const removeClass = useCallback((className: string) => {
    const el = elementRef.current;
    if (!el) return;

    el.classList.remove(className);

    setState((prev) => {
      // If it was added this session, just remove the 'added' entry
      const addedIdx = prev.classChanges.findIndex(
        (c) => c.type === 'added' && c.current === className
      );
      if (addedIdx >= 0) {
        const newChanges = [...prev.classChanges];
        newChanges.splice(addedIdx, 1);
        return {
          ...prev,
          currentClasses: Array.from(el.classList),
          classChanges: newChanges,
        };
      }

      // If it was modified (A→B), and we're removing B, record as removed A
      const modifiedIdx = prev.classChanges.findIndex(
        (c) => c.type === 'modified' && c.current === className
      );
      if (modifiedIdx >= 0) {
        const newChanges = [...prev.classChanges];
        const original = newChanges[modifiedIdx].original!;
        newChanges[modifiedIdx] = { type: 'removed', original };
        return {
          ...prev,
          currentClasses: Array.from(el.classList),
          classChanges: newChanges,
        };
      }

      // Original class being removed
      if (prev.originalClasses.includes(className)) {
        return {
          ...prev,
          currentClasses: Array.from(el.classList),
          classChanges: [
            ...prev.classChanges,
            { type: 'removed', original: className },
          ],
        };
      }

      return { ...prev, currentClasses: Array.from(el.classList) };
    });
  }, []);

  const updateClass = useCallback((oldClass: string, newClass: string) => {
    const el = elementRef.current;
    if (!el) return;

    const trimmed = newClass.trim();

    // Empty new value = removal
    if (!trimmed) {
      el.classList.remove(oldClass);
      setState((prev) => {
        // Find the original class for this chain
        const existingIdx = prev.classChanges.findIndex(
          (c) =>
            (c.type === 'modified' && c.current === oldClass) ||
            (c.type === 'added' && c.current === oldClass)
        );

        if (existingIdx >= 0) {
          const change = prev.classChanges[existingIdx];
          const newChanges = [...prev.classChanges];
          if (change.type === 'added') {
            // Was added this session, just remove it
            newChanges.splice(existingIdx, 1);
          } else {
            // Was modified from an original — now it's removed
            newChanges[existingIdx] = { type: 'removed', original: change.original };
          }
          return {
            ...prev,
            currentClasses: Array.from(el.classList),
            classChanges: newChanges,
          };
        }

        // Removing an original class
        if (prev.originalClasses.includes(oldClass)) {
          return {
            ...prev,
            currentClasses: Array.from(el.classList),
            classChanges: [...prev.classChanges, { type: 'removed', original: oldClass }],
          };
        }

        return { ...prev, currentClasses: Array.from(el.classList) };
      });
      return;
    }

    if (oldClass === trimmed) return;

    el.classList.remove(oldClass);
    el.classList.add(trimmed);

    setState((prev) => {
      const newChanges = [...prev.classChanges];

      // Check if oldClass was already tracked (chained modification)
      const existingIdx = newChanges.findIndex(
        (c) =>
          (c.type === 'modified' && c.current === oldClass) ||
          (c.type === 'added' && c.current === oldClass)
      );

      if (existingIdx >= 0) {
        const change = newChanges[existingIdx];
        if (change.type === 'added') {
          // Added this session, just update the current value
          newChanges[existingIdx] = { type: 'added', current: trimmed };
        } else {
          // Modified chain: A→B→C becomes A→C
          if (change.original === trimmed) {
            // Modified back to original — remove the change
            newChanges.splice(existingIdx, 1);
          } else {
            newChanges[existingIdx] = {
              type: 'modified',
              original: change.original,
              current: trimmed,
            };
          }
        }
      } else if (prev.originalClasses.includes(oldClass)) {
        // First modification of an original class
        newChanges.push({
          type: 'modified',
          original: oldClass,
          current: trimmed,
        });
      } else {
        // Shouldn't happen but handle gracefully
        newChanges.push({ type: 'added', current: trimmed });
      }

      return {
        ...prev,
        currentClasses: Array.from(el.classList),
        classChanges: newChanges,
      };
    });
  }, []);

  const addCustomStyle = useCallback((property: string, value: string) => {
    const el = elementRef.current;
    if (!el) return;

    setState((prev) => {
      // Save original inline style if not already saved
      const originals = { ...prev.originalInlineStyles };
      if (!(property in originals)) {
        originals[property] = el.style.getPropertyValue(property);
      }

      // Apply to element
      el.style.setProperty(property, value);

      // Update or add entry
      const existing = prev.customStyles.findIndex((s) => s.property === property);
      const newStyles = [...prev.customStyles];
      if (existing >= 0) {
        newStyles[existing] = { property, value };
      } else {
        newStyles.push({ property, value });
      }

      return { ...prev, customStyles: newStyles, originalInlineStyles: originals };
    });
  }, []);

  const removeCustomStyle = useCallback((property: string) => {
    const el = elementRef.current;
    if (!el) return;

    setState((prev) => {
      // Restore original inline style
      const original = prev.originalInlineStyles[property];
      if (original) {
        el.style.setProperty(property, original);
      } else {
        el.style.removeProperty(property);
      }

      const newStyles = prev.customStyles.filter((s) => s.property !== property);
      const originals = { ...prev.originalInlineStyles };
      delete originals[property];

      return { ...prev, customStyles: newStyles, originalInlineStyles: originals };
    });
  }, []);

  const clearCustomStyles = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;

    setState((prev) => {
      // Restore all original inline styles
      for (const entry of prev.customStyles) {
        const original = prev.originalInlineStyles[entry.property];
        if (original) {
          el.style.setProperty(entry.property, original);
        } else {
          el.style.removeProperty(entry.property);
        }
      }

      return { ...prev, customStyles: [], originalInlineStyles: {} };
    });
  }, []);

  const getElementIdentifier = useCallback((): ElementIdentifier | null => {
    // Prefer cached identifier, fall back to live DOM read
    if (state.cachedIdentifier) return state.cachedIdentifier;

    const el = elementRef.current;
    if (!el) return null;

    return computeIdentifier(el);
  }, [state.cachedIdentifier, computeIdentifier]);

  const classDiffText = useMemo((): string => {
    if (state.classChanges.length === 0) return '';

    const identifier = state.cachedIdentifier;
    if (!identifier) return '';

    const lines: string[] = ['## Class Changes', ''];
    lines.push(
      `**Element:** <${identifier.tagName}> "${identifier.textPreview}"${
        identifier.testId ? ` (data-testid="${identifier.testId}")` : ''
      }${identifier.id ? ` (id="${identifier.id}")` : ''}`
    );
    lines.push(`**Path:** ${identifier.breadcrumb.join(' › ')}`);
    lines.push('');
    lines.push('| Action | Class |');
    lines.push('|--------|-------|');

    for (const change of state.classChanges) {
      switch (change.type) {
        case 'added':
          lines.push(`| + Added | \`${change.current}\` |`);
          break;
        case 'removed':
          lines.push(`| - Removed | \`${change.original}\` |`);
          break;
        case 'modified':
          lines.push(
            `| ~ Modified | \`${change.original}\` → \`${change.current}\` |`
          );
          break;
      }
    }

    return lines.join('\n');
  }, [state.classChanges, state.cachedIdentifier]);

  const customStyleDiffText = useMemo((): string => {
    if (state.customStyles.length === 0) return '';

    const identifier = state.cachedIdentifier;
    if (!identifier) return '';

    const lines: string[] = ['## Custom Style Changes', ''];
    lines.push(
      `**Element:** <${identifier.tagName}> "${identifier.textPreview}"${
        identifier.testId ? ` (data-testid="${identifier.testId}")` : ''
      }${identifier.id ? ` (id="${identifier.id}")` : ''}`
    );
    lines.push(`**Path:** ${identifier.breadcrumb.join(' \u203A ')}`);
    lines.push('');
    lines.push('| Property | Value |');
    lines.push('|----------|-------|');

    for (const entry of state.customStyles) {
      lines.push(`| \`${entry.property}\` | \`${entry.value}\` |`);
    }

    return lines.join('\n');
  }, [state.customStyles, state.cachedIdentifier]);

  const customStyleChangeCount = state.customStyles.length;
  const changeCount = state.classChanges.length;

  return {
    // State
    isSelectorActive: state.isSelectorActive,
    selectedElement: state.selectedElement,
    originalClasses: state.originalClasses,
    currentClasses: state.currentClasses,
    classChanges: state.classChanges,
    customStyles: state.customStyles,
    changeCount,
    customStyleChangeCount,
    // Actions
    toggleSelector,
    activateSelector,
    deactivateSelector,
    selectElement,
    clearSelection,
    addClass,
    removeClass,
    updateClass,
    addCustomStyle,
    removeCustomStyle,
    clearCustomStyles,
    // Derived
    getElementIdentifier,
    classDiffText,
    customStyleDiffText,
  };
}

export type ElementInspectorReturn = ReturnType<typeof useElementInspector>;
