'use client';

import { useContext } from 'react';
import { DevLensContext } from '../DevLensProvider';
import type { DevLensContextValue } from '../DevLensProvider';

export function useDevLensConfig(): DevLensContextValue {
  return useContext(DevLensContext);
}
