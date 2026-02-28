'use client';

import { useEffect } from 'react';

interface ElementSelectorOverlayProps {
  isActive: boolean;
  onSelect: (element: HTMLElement) => void;
  onDeactivate: () => void;
}

/**
 * Imperative DOM overlay that highlights elements on hover
 * and captures click-to-select. Renders nothing to React DOM.
 */
export function ElementSelectorOverlay({
  isActive,
  onSelect,
  onDeactivate,
}: ElementSelectorOverlayProps) {
  useEffect(() => {
    if (!isActive) return;

    // Create overlay div
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 10000;
      outline: 2px solid #89b4fa;
      background: rgba(137, 180, 250, 0.08);
      transition: top 0.05s, left 0.05s, width 0.05s, height 0.05s;
      display: none;
    `;
    document.body.appendChild(overlay);

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target === overlay) return;

      // Exclude token editor drawer
      if (target.closest('.te-drawer')) {
        overlay.style.display = 'none';
        return;
      }

      const rect = target.getBoundingClientRect();
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.display = 'block';
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Exclude token editor drawer
      if (target.closest('.te-drawer')) return;

      e.preventDefault();
      e.stopPropagation();

      onSelect(target);
      onDeactivate();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDeactivate();
      }
    };

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };
  }, [isActive, onSelect, onDeactivate]);

  // No React DOM output
  return null;
}
