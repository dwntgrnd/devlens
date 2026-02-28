'use client';

import dynamic from 'next/dynamic';
import { DevLensProvider } from './DevLensProvider';
import type { DevLensConfig } from './config/types';
import './styles/devlens.css';

const DevLensDrawer = dynamic(
  () =>
    import('./components/DevLensDrawer').then((mod) => ({
      default: mod.DevLensDrawer,
    })),
  { ssr: false },
);

export interface DevLensProps extends DevLensConfig {
  /** Force enable outside dev mode (default: false) */
  forceEnable?: boolean;
}

export function DevLens({ forceEnable, ...config }: DevLensProps) {
  if (!forceEnable && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <DevLensProvider {...config}>
      <DevLensDrawer />
    </DevLensProvider>
  );
}
