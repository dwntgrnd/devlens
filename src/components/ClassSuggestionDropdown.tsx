'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface ClassSuggestionDropdownProps {
  suggestions: string[];
  inputValue: string;
  onSelect: (className: string) => void;
  onDismiss: () => void;
  visible: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ClassSuggestionDropdown({
  suggestions,
  inputValue,
  onSelect,
  onDismiss,
  visible,
  inputRef,
}: ClassSuggestionDropdownProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(0);
  }, [suggestions]);

  // Compute fixed position from input's bounding rect
  useEffect(() => {
    if (!visible || !inputRef?.current) {
      setPosition(null);
      return;
    }
    const rect = inputRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 2,
      left: rect.left,
      width: rect.width,
    });
  }, [visible, inputRef, suggestions]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible || suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestions[activeIndex]) {
          onSelect(suggestions[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    },
    [visible, suggestions, activeIndex, onSelect, onDismiss]
  );

  // Attach keyboard listener to window (capturing) to intercept before input handlers
  useEffect(() => {
    if (!visible || suggestions.length === 0) return;
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [visible, suggestions, handleKeyDown]);

  if (!visible || suggestions.length === 0 || !position) return null;

  const query = inputValue.toLowerCase();

  const style: React.CSSProperties = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    width: position.width,
    maxHeight: 240,
    overflowY: 'auto',
    background: '#1e1e2e',
    border: '1px solid #45475a',
    borderRadius: 4,
    zIndex: 10001,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  };

  return createPortal(
    <div className="te-suggest-dropdown" ref={listRef} style={style}>
      {suggestions.slice(0, 15).map((cls, i) => {
        // Highlight matching substring
        const lower = cls.toLowerCase();
        const matchIdx = lower.indexOf(query);
        let content: React.ReactNode = cls;

        if (matchIdx >= 0 && query.length > 0) {
          const before = cls.slice(0, matchIdx);
          const match = cls.slice(matchIdx, matchIdx + query.length);
          const after = cls.slice(matchIdx + query.length);
          content = (
            <>
              {before}
              <span className="te-suggest-match">{match}</span>
              {after}
            </>
          );
        }

        return (
          <div
            key={cls}
            className={`te-suggest-item ${i === activeIndex ? 'te-suggest-item-active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault(); // Don't blur input
              onSelect(cls);
            }}
            onMouseEnter={() => setActiveIndex(i)}
          >
            {content}
          </div>
        );
      })}
    </div>,
    document.body
  );
}
