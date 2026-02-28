'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDevLensConfig } from './use-devlens-config';

export type DockPosition = 'left' | 'right' | 'bottom' | 'detached';

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useDockPosition() {
  const { namespace } = useDevLensConfig();
  const DOCK_KEY = `${namespace}-dock`;
  const OPEN_KEY = `${namespace}-open`;

  const [dock, setDockState] = useState<DockPosition>('right');
  const [isOpen, setIsOpenState] = useState(false);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setDockState(readStorage<DockPosition>(DOCK_KEY, 'right'));
    setIsOpenState(readStorage<boolean>(OPEN_KEY, false));
  }, [DOCK_KEY, OPEN_KEY]);

  const setDock = useCallback((pos: DockPosition) => {
    setDockState(pos);
    localStorage.setItem(DOCK_KEY, JSON.stringify(pos));
  }, [DOCK_KEY]);

  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open);
    localStorage.setItem(OPEN_KEY, JSON.stringify(open));
  }, [OPEN_KEY]);

  const toggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  return { dock, setDock, isOpen, setIsOpen, toggle };
}
