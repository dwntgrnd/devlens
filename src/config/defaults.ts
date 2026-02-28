import type { DevLensConfig } from './types';

export const DEFAULT_CONFIG: Required<DevLensConfig> = {
  tokenOverrides: {},
  tokenGroups: [],
  scaleBaseline: { mapping: [] },
  migrationMap: {},
  projectTextSizeClasses: [],
  namespace: 'devlens',
  detachedRoute: '/dev/devlens-detached',
  previewFontFamily: 'inherit',
};
