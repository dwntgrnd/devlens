'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDevLensConfig } from './use-devlens-config';

export function useDetachedWindow() {
  const { namespace, detachedRoute } = useDevLensConfig();
  const windowName = `${namespace}-detached`;

  const windowRef = useRef<Window | null>(null);
  const [isDetached, setIsDetached] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detach = useCallback(() => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.focus();
      return;
    }

    const popup = window.open(
      detachedRoute,
      windowName,
      'width=380,height=700,menubar=no,toolbar=no,location=no,status=no'
    );

    if (popup) {
      windowRef.current = popup;
      setIsDetached(true);
    }
  }, [detachedRoute, windowName]);

  const reattach = useCallback(() => {
    if (windowRef.current && !windowRef.current.closed) {
      windowRef.current.close();
    }
    windowRef.current = null;
    setIsDetached(false);
  }, []);

  // Poll to detect manual close of the detached window
  useEffect(() => {
    if (isDetached) {
      pollRef.current = setInterval(() => {
        if (windowRef.current?.closed) {
          windowRef.current = null;
          setIsDetached(false);
        }
      }, 500);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isDetached]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
    };
  }, []);

  return { isDetached, detach, reattach };
}
