'use client';

import type { DevLensConfig } from './config/types';

// Placeholder — DevLensDrawer will be wired in DL-CC08
// For now, renders nothing to allow typecheck to pass

export interface DevLensProps extends DevLensConfig {
  /** Force enable outside dev mode (default: false) */
  forceEnable?: boolean;
}

export function DevLens(props: DevLensProps) {
  if (!props.forceEnable && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return null; // Wired in DL-CC08
}
