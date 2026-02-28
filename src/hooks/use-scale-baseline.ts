'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDevLensConfig } from './use-devlens-config';
import { buildBaselineCSS } from '../core/scale-baseline';

export interface UseScaleBaselineReturn {
  /** Whether the baseline CSS is currently injected */
  isActive: boolean;
  /** Toggle the baseline overlay on/off */
  toggle: () => void;
  /** Whether the config provides a non-empty baseline */
  hasBaseline: boolean;
}

/**
 * Reads `scaleBaseline` and `namespace` from DevLens context.
 * Manages injection of a `<style>` tag with baseline CSS when active.
 */
export function useScaleBaseline(): UseScaleBaselineReturn {
  const { scaleBaseline, namespace } = useDevLensConfig();
  const [isActive, setIsActive] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const hasBaseline =
    !!scaleBaseline &&
    !!scaleBaseline.mapping &&
    scaleBaseline.mapping.length > 0;

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isActive && hasBaseline) {
      const css = buildBaselineCSS(scaleBaseline);
      if (!css) return;

      const style = document.createElement('style');
      style.setAttribute('data-devlens', `${namespace}-scale-baseline`);
      style.textContent = css;
      document.head.appendChild(style);
      styleRef.current = style;

      return () => {
        if (styleRef.current) {
          styleRef.current.remove();
          styleRef.current = null;
        }
      };
    } else if (styleRef.current) {
      styleRef.current.remove();
      styleRef.current = null;
    }
  }, [isActive, hasBaseline, scaleBaseline, namespace]);

  return { isActive, toggle, hasBaseline };
}
