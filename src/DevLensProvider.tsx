'use client';

import React, { createContext, useMemo } from 'react';
import type { DevLensConfig } from './config/types';
import { DEFAULT_CONFIG } from './config/defaults';

export interface DevLensContextValue extends Required<DevLensConfig> {}

export const DevLensContext = createContext<DevLensContextValue>(DEFAULT_CONFIG);

interface DevLensProviderProps extends DevLensConfig {
  children: React.ReactNode;
}

export function DevLensProvider({ children, ...config }: DevLensProviderProps) {
  const value = useMemo<DevLensContextValue>(
    () => ({
      ...DEFAULT_CONFIG,
      ...config,
      // Deep merge maps rather than replace
      tokenOverrides: { ...DEFAULT_CONFIG.tokenOverrides, ...config.tokenOverrides },
      migrationMap: { ...DEFAULT_CONFIG.migrationMap, ...config.migrationMap },
      tokenGroups: [
        ...DEFAULT_CONFIG.tokenGroups,
        ...(config.tokenGroups ?? []),
      ],
      projectTextSizeClasses: [
        ...DEFAULT_CONFIG.projectTextSizeClasses,
        ...(config.projectTextSizeClasses ?? []),
      ],
    }),
    [config]
  );

  return (
    <DevLensContext.Provider value={value}>
      {children}
    </DevLensContext.Provider>
  );
}
