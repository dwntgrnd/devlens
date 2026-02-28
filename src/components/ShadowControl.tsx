'use client';

import { useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

interface ShadowControlProps {
  label: React.ReactNode;
  value: string;
  isModified: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}

const SHADOW_PRESETS: Record<string, string> = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

function detectPreset(value: string): string {
  const trimmed = value.trim();
  for (const [key, preset] of Object.entries(SHADOW_PRESETS)) {
    if (trimmed === preset) return key;
  }
  return 'custom';
}

export function ShadowControl({
  label,
  value,
  isModified,
  onChange,
  onReset,
}: ShadowControlProps) {
  const currentPreset = detectPreset(value);

  const handleChange = useCallback(
    (preset: string) => {
      const shadow = SHADOW_PRESETS[preset];
      if (shadow) {
        onChange(shadow);
      }
    },
    [onChange]
  );

  return (
    <div className="te-control">
      <div className="te-control-header">
        <span className="te-label">
          {label}
          {isModified && <span className="te-modified-dot" />}
        </span>
        {isModified && (
          <button
            type="button"
            className="te-icon-btn te-reset-btn"
            onClick={onReset}
            title="Reset to default"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      <select
        value={currentPreset}
        onChange={(e) => handleChange(e.target.value)}
        className="te-select te-select-full"
      >
        <option value="none">None</option>
        <option value="sm">Small</option>
        <option value="md">Medium</option>
        <option value="lg">Large</option>
        <option value="xl">Extra Large</option>
        {currentPreset === 'custom' && (
          <option value="custom" disabled>
            Custom
          </option>
        )}
      </select>

      <div
        className="te-shadow-preview"
        style={{ boxShadow: value === 'none' ? 'none' : value }}
      />
    </div>
  );
}
