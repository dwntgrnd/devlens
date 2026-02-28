import type { DevLensConfig } from './types';
import { DEFAULT_MIGRATION_MAP } from './migration-defaults';

export const DEFAULT_CONFIG: Required<DevLensConfig> = {
  tokenOverrides: {},
  tokenGroups: [],
  scaleBaseline: { mapping: [] },
  migrationMap: DEFAULT_MIGRATION_MAP,
  projectTextSizeClasses: [],
  namespace: 'devlens',
  detachedRoute: '/dev/devlens-detached',
  previewFontFamily: 'inherit',
};
