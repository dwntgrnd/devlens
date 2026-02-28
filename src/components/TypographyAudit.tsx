'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDevLensConfig } from '../hooks/use-devlens-config';
import { getExpectedScaleStep, findNearestScaleStep } from '../core/scale-step-lookup';
import { findFontSizeClasses } from '../core/class-categories';
import { InspectorSwitch } from './InspectorSwitch';
import type { TokenCreationContext } from './RawCssInput';

interface TypographyAuditProps {
  element: HTMLElement;
  currentClasses: string[];
  onRemoveClass: (className: string) => void;
  isBaselineActive: boolean;
  onCreateToken?: (context: TokenCreationContext) => void;
}

interface PreviewState {
  element: HTMLElement;
  removedClasses: string[];
  originalInlineFontSize: string;
  originalInlineLineHeight: string;
  addedInlineStyles: boolean;
  fontSizeVar: string;
  lineHeightVar: string;
}

function revertPreview(state: PreviewState) {
  // Re-add removed classes
  for (const cls of state.removedClasses) {
    state.element.classList.add(cls);
  }
  // Remove inline styles if we added them
  if (state.addedInlineStyles) {
    state.element.style.fontSize = state.originalInlineFontSize;
    state.element.style.lineHeight = state.originalInlineLineHeight;
  }
}

/** Format delta with proper minus sign (U+2212) */
function formatDelta(delta: number): string {
  const rounded = Math.round(delta * 100) / 100;
  if (rounded >= 0) return `+${rounded}px`;
  return `\u2212${Math.abs(rounded)}px`;
}

export function TypographyAudit({
  element,
  currentClasses,
  onRemoveClass,
  isBaselineActive,
  onCreateToken,
}: TypographyAuditProps) {
  const { scaleBaseline, projectTextSizeClasses } = useDevLensConfig();
  const projectTextSizeSet = useMemo(
    () => new Set(projectTextSizeClasses),
    [projectTextSizeClasses],
  );
  const [showOnScale, setShowOnScale] = useState(false);
  const previewStateRef = useRef<PreviewState | null>(null);

  // Revert preview on unmount or element change
  useEffect(() => {
    return () => {
      if (previewStateRef.current) {
        revertPreview(previewStateRef.current);
        previewStateRef.current = null;
      }
    };
  }, [element]);

  // Reset toggle when element changes
  useEffect(() => {
    setShowOnScale(false);
  }, [element]);

  const tagName = element.tagName.toLowerCase();
  const expected = getExpectedScaleStep(tagName, scaleBaseline);
  const computed = getComputedStyle(element);
  const computedFontSize = parseFloat(computed.fontSize);
  const rawLineHeight = computed.lineHeight;
  const computedLineHeight = rawLineHeight === 'normal' ? 1.5 : parseFloat(rawLineHeight) / computedFontSize;
  const fontSizeClasses = findFontSizeClasses(currentClasses, projectTextSizeSet);
  const viaClass = fontSizeClasses.length > 0 ? fontSizeClasses[0] : null;

  const handleTogglePreview = (checked: boolean) => {
    if (!expected) return;

    if (checked) {
      // Store state for revert
      const state: PreviewState = {
        element,
        removedClasses: [...fontSizeClasses],
        originalInlineFontSize: element.style.fontSize,
        originalInlineLineHeight: element.style.lineHeight,
        addedInlineStyles: false,
        fontSizeVar: expected.mapping.fontSizeVar,
        lineHeightVar: expected.mapping.lineHeightVar,
      };

      // Remove font-size classes from element
      for (const cls of fontSizeClasses) {
        element.classList.remove(cls);
      }

      // If baseline is not active, apply inline styles as fallback
      if (!isBaselineActive) {
        element.style.fontSize = `var(${expected.mapping.fontSizeVar})`;
        element.style.lineHeight = `var(${expected.mapping.lineHeightVar})`;
        state.addedInlineStyles = true;
      }

      previewStateRef.current = state;
      setShowOnScale(true);
    } else {
      // Revert
      if (previewStateRef.current) {
        revertPreview(previewStateRef.current);
        previewStateRef.current = null;
      }
      setShowOnScale(false);
    }
  };

  const handleStripOverride = () => {
    // If preview is active, revert first
    if (previewStateRef.current) {
      revertPreview(previewStateRef.current);
      previewStateRef.current = null;
      setShowOnScale(false);
    }
    // Strip font-size classes (tracked change)
    for (const cls of fontSizeClasses) {
      onRemoveClass(cls);
    }
  };

  // === Unmapped element ===
  if (!expected) {
    const nearest = findNearestScaleStep(computedFontSize, scaleBaseline);
    return (
      <div className="te-typo-audit">
        <div className="te-typo-audit-header">Typography Audit</div>
        <div className="te-typo-status" style={{ color: '#6c7086' }}>
          No scale mapping for &lt;{tagName}&gt;
        </div>
        <div className="te-typo-detail">
          Computed: {Math.round(computedFontSize * 100) / 100}px · Line-height: {Math.round(computedLineHeight * 100) / 100}
        </div>
        {nearest && (
          <div className="te-typo-detail-muted">
            Nearest: {nearest.mapping.scaleLabel} ({Math.round(nearest.expectedPx * 100) / 100}px)
            {Math.abs(nearest.deltaPx) <= 0.5 ? ' ✓' : ` (${formatDelta(nearest.deltaPx)})`}
          </div>
        )}
      </div>
    );
  }

  const deltaPx = computedFontSize - expected.expectedPx;
  const absDelta = Math.abs(deltaPx);
  const lineHeightDiff = Math.abs(computedLineHeight - expected.expectedLineHeight);

  // === State A: On-scale ===
  if (absDelta <= 0.5) {
    return (
      <div className="te-typo-audit">
        <div className="te-typo-audit-header">Typography Audit</div>
        <div className="te-typo-status" style={{ color: '#a6e3a1' }}>
          ✓ On scale
        </div>
        <div className="te-typo-detail">
          &lt;{tagName}&gt; → {expected.mapping.scaleLabel} ({Math.round(expected.expectedPx * 100) / 100}px)
        </div>
        <div className="te-typo-detail-muted">
          Computed: {Math.round(computedFontSize * 100) / 100}px · Line-height: {Math.round(computedLineHeight * 100) / 100}
        </div>
      </div>
    );
  }

  // === State B: Near-scale ===
  if (absDelta <= 3.0) {
    return (
      <div className="te-typo-audit">
        <div className="te-typo-audit-header">Typography Audit</div>
        <div className="te-typo-status" style={{ color: '#f9e2af' }}>
          ≈ Near scale ({formatDelta(deltaPx)})
        </div>
        <div className="te-typo-detail">
          &lt;{tagName}&gt; → {expected.mapping.scaleLabel} (expected {Math.round(expected.expectedPx * 100) / 100}px)
        </div>
        <div className="te-typo-detail">
          Computed: {Math.round(computedFontSize * 100) / 100}px{viaClass ? ` via ${viaClass}` : ' via inherited'}
        </div>
        {lineHeightDiff > 0.02 && (
          <div className="te-typo-detail-muted">
            Line-height: {Math.round(computedLineHeight * 100) / 100} (expected {expected.expectedLineHeight})
          </div>
        )}
        <div className="te-typo-actions">
          <InspectorSwitch
            checked={showOnScale}
            onChange={() => handleTogglePreview(!showOnScale)}
            labelOn="Previewing"
            labelOff="Show on-scale"
            compact
          />
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
            {onCreateToken && (
              <button
                type="button"
                className="te-btn te-btn-secondary"
                onClick={() => {
                  const props: { property: string; value: string }[] = [
                    { property: 'font-size', value: `${Math.round(computedFontSize * 100) / 100}px` },
                  ];
                  if (lineHeightDiff > 0.02) {
                    props.push({ property: 'line-height', value: `${Math.round(computedLineHeight * 100) / 100}` });
                  }
                  onCreateToken({
                    source: 'deviation',
                    properties: props,
                    elementTag: tagName,
                    computedFontSize,
                    expectedPx: expected.expectedPx,
                    scaleLabel: expected.mapping.scaleLabel,
                  });
                }}
              >
                Create token &rarr;
              </button>
            )}
            {fontSizeClasses.length > 0 && (
              <button
                type="button"
                className="te-btn te-btn-secondary"
                onClick={handleStripOverride}
              >
                Strip override
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // === State C: Off-scale ===
  return (
    <div className="te-typo-audit">
      <div className="te-typo-audit-header">Typography Audit</div>
      <div className="te-typo-status" style={{ color: '#fab387' }}>
        ⚡ Off-scale ({formatDelta(deltaPx)})
      </div>
      <div className="te-typo-detail">
        &lt;{tagName}&gt; → {expected.mapping.scaleLabel} (expected {Math.round(expected.expectedPx * 100) / 100}px)
      </div>
      <div className="te-typo-detail">
        Computed: {Math.round(computedFontSize * 100) / 100}px{viaClass ? ` via ${viaClass}` : ' via inherited'}
      </div>
      {lineHeightDiff > 0.02 && (
        <div className="te-typo-detail-muted">
          Line-height: {Math.round(computedLineHeight * 100) / 100} (expected {expected.expectedLineHeight})
        </div>
      )}
      <div className="te-typo-actions">
        <InspectorSwitch
          checked={showOnScale}
          onChange={() => handleTogglePreview(!showOnScale)}
          labelOn="Previewing"
          labelOff="Show on-scale"
          compact
        />
        {onCreateToken ? (
          <button
            type="button"
            className="te-btn te-btn-secondary"
            style={{ marginLeft: 'auto' }}
            onClick={() => {
              const props: { property: string; value: string }[] = [
                { property: 'font-size', value: `${Math.round(computedFontSize * 100) / 100}px` },
              ];
              if (lineHeightDiff > 0.02) {
                props.push({ property: 'line-height', value: `${Math.round(computedLineHeight * 100) / 100}` });
              }
              const computed = getComputedStyle(element);
              const fontWeight = computed.fontWeight;
              if (fontWeight && fontWeight !== '400') {
                props.push({ property: 'font-weight', value: fontWeight });
              }
              const letterSpacing = computed.letterSpacing;
              if (letterSpacing && letterSpacing !== 'normal' && letterSpacing !== '0px') {
                props.push({ property: 'letter-spacing', value: letterSpacing });
              }
              onCreateToken({
                source: 'deviation',
                properties: props,
                elementTag: tagName,
                computedFontSize,
                expectedPx: expected.expectedPx,
                scaleLabel: expected.mapping.scaleLabel,
              });
            }}
          >
            Create token &rarr;
          </button>
        ) : (
          <button
            type="button"
            className="te-btn te-btn-secondary"
            style={{ marginLeft: 'auto', opacity: 0.5, cursor: 'not-allowed' }}
            disabled
            title="Available in a future update"
          >
            Create token &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
