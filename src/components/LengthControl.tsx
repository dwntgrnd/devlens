'use client';

import { useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';

interface LengthControlProps {
  label: React.ReactNode;
  value: string;
  isModified: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
  isFontSize?: boolean;
}

function parseLength(raw: string): { num: number; unit: string } {
  const match = raw.trim().match(/^([\d.]+)\s*(px|rem|em|%)$/);
  if (match) {
    return { num: parseFloat(match[1]), unit: match[2] };
  }
  // Fallback: try as raw number (px)
  const num = parseFloat(raw);
  if (!isNaN(num)) {
    return { num, unit: 'px' };
  }
  return { num: 16, unit: 'px' };
}

export function LengthControl({
  label,
  value,
  isModified,
  onChange,
  onReset,
  isFontSize,
}: LengthControlProps) {
  const parsed = useMemo(() => parseLength(value), [value]);

  const maxRange = useMemo(() => {
    if (isFontSize) return parsed.unit === 'rem' ? 4 : 64;
    if (parsed.unit === 'rem') return 120;
    return 2000;
  }, [isFontSize, parsed.unit]);

  const step = parsed.unit === 'rem' ? 0.125 : 1;

  const handleNumChange = useCallback(
    (rawValue: string) => {
      const num = parseFloat(rawValue);
      if (!isNaN(num)) {
        onChange(`${num}${parsed.unit}`);
      }
    },
    [onChange, parsed.unit]
  );

  const handleUnitChange = useCallback(
    (newUnit: string) => {
      let converted = parsed.num;
      if (parsed.unit === 'px' && newUnit === 'rem') {
        converted = parseFloat((parsed.num / 16).toFixed(3));
      } else if (parsed.unit === 'rem' && newUnit === 'px') {
        converted = Math.round(parsed.num * 16);
      }
      onChange(`${converted}${newUnit}`);
    },
    [onChange, parsed]
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

      <div className="te-length-row">
        <input
          type="number"
          value={parsed.num}
          onChange={(e) => handleNumChange(e.target.value)}
          step={step}
          min={0}
          className="te-text-input te-num-input"
        />
        <select
          value={parsed.unit}
          onChange={(e) => handleUnitChange(e.target.value)}
          className="te-select"
        >
          <option value="px">px</option>
          <option value="rem">rem</option>
        </select>
      </div>

      <input
        type="range"
        min={0}
        max={maxRange}
        step={step}
        value={parsed.num}
        onChange={(e) => handleNumChange(e.target.value)}
        className="te-slider te-slider-full"
      />

      {isFontSize && (
        <div
          className="te-font-preview"
          style={{ fontSize: value }}
        >
          Aa Bb Cc 123
        </div>
      )}
    </div>
  );
}
