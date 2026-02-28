'use client';

import { useCallback, useMemo } from 'react';
import { RotateCcw, Copy } from 'lucide-react';
import { parseHslString, formatHslString, hslToHex, hexToHsl } from '../core/color-utils';

interface HslColorControlProps {
  label: React.ReactNode;
  value: string; // HSL string like "27 87% 57%"
  isModified: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
}

export function HslColorControl({
  label,
  value,
  isModified,
  onChange,
  onReset,
}: HslColorControlProps) {
  const hsl = useMemo(() => parseHslString(value), [value]);

  const hex = useMemo(() => {
    if (!hsl) return '#888888';
    return hslToHex(hsl.h, hsl.s, hsl.l);
  }, [hsl]);

  const handleSliderChange = useCallback(
    (channel: 'h' | 's' | 'l', rawValue: string) => {
      if (!hsl) return;
      const updated = { ...hsl, [channel]: parseFloat(rawValue) };
      onChange(formatHslString(updated));
    },
    [hsl, onChange]
  );

  const handleHexChange = useCallback(
    (hexInput: string) => {
      if (/^#[0-9a-fA-F]{6}$/.test(hexInput)) {
        const converted = hexToHsl(hexInput);
        onChange(formatHslString(converted));
      }
    },
    [onChange]
  );

  const copyHsl = useCallback(() => {
    navigator.clipboard.writeText(value);
  }, [value]);

  if (!hsl) {
    return (
      <div className="te-control">
        <span className="te-label">{label}</span>
        <span className="te-muted">Invalid HSL: {value}</span>
      </div>
    );
  }

  return (
    <div className="te-control">
      <div className="te-control-header">
        <span className="te-label">
          {label}
          {isModified && <span className="te-modified-dot" />}
        </span>
        <div className="te-control-actions">
          <button
            type="button"
            className="te-icon-btn"
            onClick={copyHsl}
            title="Copy HSL value"
          >
            <Copy size={12} />
          </button>
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
      </div>

      <div className="te-color-row">
        <input
          type="color"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          className="te-color-swatch"
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => handleHexChange(e.target.value)}
          className="te-text-input te-hex-input"
          spellCheck={false}
        />
      </div>

      <div className="te-slider-group">
        <div className="te-slider-row">
          <span className="te-slider-label">H</span>
          <input
            type="range"
            min={0}
            max={360}
            value={hsl.h}
            onChange={(e) => handleSliderChange('h', e.target.value)}
            className="te-slider"
          />
          <span className="te-slider-value">{Math.round(hsl.h)}</span>
        </div>
        <div className="te-slider-row">
          <span className="te-slider-label">S</span>
          <input
            type="range"
            min={0}
            max={100}
            value={hsl.s}
            onChange={(e) => handleSliderChange('s', e.target.value)}
            className="te-slider"
          />
          <span className="te-slider-value">{Math.round(hsl.s)}%</span>
        </div>
        <div className="te-slider-row">
          <span className="te-slider-label">L</span>
          <input
            type="range"
            min={0}
            max={100}
            value={hsl.l}
            onChange={(e) => handleSliderChange('l', e.target.value)}
            className="te-slider"
          />
          <span className="te-slider-value">{Math.round(hsl.l)}%</span>
        </div>
      </div>
    </div>
  );
}
