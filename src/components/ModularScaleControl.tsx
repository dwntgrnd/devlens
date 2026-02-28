'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  FONT_STEPS,
  SCALE_RATIOS,
  calculateScale,
  detectClosestRatio,
  parsePx,
} from '../core/modular-scale';
import { InspectorSwitch } from './InspectorSwitch';
import type { ScaleMetadata } from '../hooks/use-token-editor';

interface ModularScaleControlProps {
  getCurrentValue: (cssVar: string) => string;
  isModified: (cssVar: string) => boolean;
  updateToken: (cssVar: string, value: string) => void;
  resetToken: (cssVar: string) => void;
  setScaleMetadata: (meta: ScaleMetadata) => void;
  scaleBaseline: { isActive: boolean; toggle: () => void };
}

export function ModularScaleControl({
  getCurrentValue,
  isModified,
  updateToken,
  resetToken,
  setScaleMetadata,
  scaleBaseline,
}: ModularScaleControlProps) {
  const initializedRef = useRef(false);

  // Parse initial base from current value
  const [base, setBase] = useState(() => {
    const val = parsePx(getCurrentValue('--font-base'));
    return isNaN(val) ? 16 : val;
  });

  const [ratio, setRatio] = useState(() => {
    const baseVal = parsePx(getCurrentValue('--font-base'));
    const b = isNaN(baseVal) ? 16 : baseVal;
    const ptVal = parsePx(getCurrentValue('--font-size-page-title'));
    const pt = isNaN(ptVal) ? 24 : ptVal;
    return detectClosestRatio(b, pt);
  });

  // Re-detect on mount once defaults are loaded (getCurrentValue may initially be empty)
  useEffect(() => {
    if (initializedRef.current) return;
    const baseStr = getCurrentValue('--font-base');
    const ptStr = getCurrentValue('--font-size-page-title');
    if (!baseStr && !ptStr) return;

    initializedRef.current = true;
    const b = parsePx(baseStr) || 16;
    const pt = parsePx(ptStr) || 24;
    setBase(b);
    setRatio(detectClosestRatio(b, pt));
  }, [getCurrentValue]);

  const applyScale = useCallback(
    (newBase: number, newRatio: number) => {
      updateToken('--font-base', `${newBase}px`);
      for (const step of FONT_STEPS) {
        updateToken(step.cssVar, calculateScale(newBase, newRatio, step.step));
      }
      const ratioEntry = SCALE_RATIOS.find((r) => r.value === newRatio);
      setScaleMetadata({
        base: newBase,
        ratio: newRatio,
        ratioLabel: ratioEntry?.label ?? `${newRatio}`,
      });
    },
    [updateToken, setScaleMetadata]
  );

  const handleBaseChange = useCallback(
    (newBase: number) => {
      setBase(newBase);
      applyScale(newBase, ratio);
    },
    [ratio, applyScale]
  );

  const handleRatioChange = useCallback(
    (newRatio: number) => {
      setRatio(newRatio);
      applyScale(base, newRatio);
    },
    [base, applyScale]
  );

  const handleResetAll = useCallback(() => {
    resetToken('--font-base');
    for (const step of FONT_STEPS) {
      resetToken(step.cssVar);
    }
  }, [resetToken]);

  // Check if any font-size tokens are modified
  const hasModifications =
    isModified('--font-base') ||
    FONT_STEPS.some((s) => isModified(s.cssVar));

  // Get the ratio label for display
  const ratioEntry = SCALE_RATIOS.find((r) => r.value === ratio);

  return (
    <div className="te-scale">
      {/* Scale baseline toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        marginBottom: 8,
        background: '#181825',
        borderRadius: 6,
        border: '1px solid #313244',
      }}>
        <div>
          <span className="te-label" style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: 12 }}>
            Scale Baseline
          </span>
          <span className="te-muted" style={{ display: 'block', marginTop: 4, fontSize: 10, lineHeight: 1.3 }}>
            Applies modular scale to bare h1–h6, p, small elements via CSS cascade layer. Tailwind classes override.
          </span>
        </div>
        <InspectorSwitch
          checked={scaleBaseline.isActive}
          onChange={scaleBaseline.toggle}
          labelOn="On"
          labelOff="Off"
          compact
        />
      </div>

      {/* Reset button */}
      {hasModifications && (
        <div className="te-scale-reset-row">
          <button
            type="button"
            className="te-icon-btn te-reset-btn"
            onClick={handleResetAll}
            title="Reset all font sizes"
          >
            <RotateCcw size={12} />
            <span style={{ fontSize: 11, marginLeft: 2 }}>Reset</span>
          </button>
        </div>
      )}

      {/* Base size slider */}
      <div className="te-scale-control-row">
        <label className="te-label" style={{ marginBottom: 4 }}>Base Size</label>
        <div className="te-slider-row">
          <input
            type="range"
            className="te-slider"
            min={12}
            max={22}
            step={0.5}
            value={base}
            onChange={(e) => handleBaseChange(parseFloat(e.target.value))}
          />
          <span className="te-slider-value" style={{ width: 44 }}>
            {base}px
          </span>
        </div>
      </div>

      {/* Scale ratio dropdown */}
      <div className="te-scale-control-row" style={{ marginTop: 8 }}>
        <label className="te-label" style={{ marginBottom: 4 }}>Scale Ratio</label>
        <select
          className="te-select te-select-full"
          value={ratio}
          onChange={(e) => handleRatioChange(parseFloat(e.target.value))}
        >
          {SCALE_RATIOS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Preview panel */}
      <div className="te-scale-preview" style={{ marginTop: 12 }}>
        <div className="te-scale-preview-header">
          <span className="te-label">Preview</span>
          <span className="te-muted">{ratioEntry?.label ?? `${ratio}`}</span>
        </div>
        {FONT_STEPS.slice().reverse().map((step) => {
          const computed = calculateScale(base, ratio, step.step);
          const px = parsePx(computed);
          return (
            <div key={step.cssVar} className="te-scale-row">
              <span
                className="te-scale-sample"
                style={{
                  fontSize: `${px}px`,
                  fontFamily: 'var(--devlens-preview-font, inherit)',
                  lineHeight: 1.3,
                }}
              >
                {step.label}
              </span>
              <span className="te-scale-meta">
                <span className="te-scale-px">{Math.round(px * 10) / 10}px</span>
                <span className="te-scale-step">{step.step >= 0 ? '+' : ''}{step.step}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
