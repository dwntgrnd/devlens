'use client';

import { useCallback, useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useDevLensConfig } from '../hooks/use-devlens-config';
import { autoDetectTokens } from '../core/auto-detect';
import { buildRegistry } from '../core/token-registry';
import { generateCCPrompt } from '../core/cc-prompt-generator';
import type { TokenCreationContext } from './RawCssInput';

interface TokenCreationFormProps {
  context: TokenCreationContext;
  onBack: () => void;
  onApplyLocally?: (tokenName: string, properties: { property: string; value: string }[]) => void;
}

function toKebab(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function TokenCreationForm({
  context,
  onBack,
  onApplyLocally,
}: TokenCreationFormProps) {
  const [tokenName, setTokenName] = useState(() => {
    if (context.source === 'deviation' && context.scaleLabel) {
      return toKebab(context.scaleLabel) + '-override';
    }
    return '';
  });

  const [selectedProps, setSelectedProps] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const p of context.properties) {
      set.add(p.property);
    }
    return set;
  });

  const [scaleType, setScaleType] = useState<'independent' | 'derived'>('independent');
  const [copied, setCopied] = useState(false);

  const { tokenOverrides } = useDevLensConfig();

  const registry = useMemo(
    () => buildRegistry(autoDetectTokens(), tokenOverrides),
    [tokenOverrides],
  );

  const kebabName = toKebab(tokenName);

  // Check collision against the merged registry
  const collision = useMemo(() => {
    if (!kebabName) return false;
    return `--${kebabName}` in registry;
  }, [kebabName, registry]);

  // Compute multiplier if derived from --font-base
  const multiplier = useMemo(() => {
    if (context.source !== 'deviation' || !context.computedFontSize) return undefined;
    // Default --font-base is 16px
    const fontBase = 16;
    return Math.round((context.computedFontSize / fontBase) * 1000) / 1000;
  }, [context]);

  const toggleProp = useCallback((prop: string) => {
    setSelectedProps((prev) => {
      const next = new Set(prev);
      if (next.has(prop)) {
        // Don't allow deselecting font-size in deviation mode
        if (context.source === 'deviation' && prop === 'font-size') return prev;
        next.delete(prop);
      } else {
        next.add(prop);
      }
      return next;
    });
  }, [context.source]);

  const activeProperties = useMemo(
    () => context.properties.filter((p) => selectedProps.has(p.property)),
    [context.properties, selectedProps]
  );

  // Generate output preview
  const outputPreview = useMemo(() => {
    if (!kebabName || activeProperties.length === 0) return '';

    const lines: string[] = [];
    lines.push('/* :root */');
    for (const p of activeProperties) {
      if (scaleType === 'derived' && multiplier && p.property === 'font-size') {
        lines.push(`--${kebabName}-${p.property}: calc(var(--font-base) * ${multiplier});`);
      } else {
        lines.push(`--${kebabName}-${p.property}: ${p.value};`);
      }
    }

    lines.push('');
    lines.push('/* @theme inline */');
    for (const p of activeProperties) {
      lines.push(`--${kebabName}-${p.property}: var(--${kebabName}-${p.property});`);
    }

    lines.push('');
    lines.push('/* token-registry.ts */');
    for (const p of activeProperties) {
      lines.push(`'--${kebabName}-${p.property}': { group: 'Typography Scale' },`);
    }

    return lines.join('\n');
  }, [kebabName, activeProperties, scaleType, multiplier]);

  const handleCopy = useCallback(async () => {
    const prompt = generateCCPrompt({
      tokenName: kebabName,
      properties: activeProperties.map((p) => ({
        property: p.property,
        value: p.value,
        locked: context.source === 'deviation' && p.property === 'font-size',
      })),
      context: context.source,
      elementTag: context.elementTag,
      elementPath: context.elementPath,
      scaleRelationship: context.source === 'deviation'
        ? {
            type: scaleType,
            baseVar: '--font-base',
            multiplier: scaleType === 'derived' ? multiplier : undefined,
          }
        : undefined,
    });

    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [kebabName, activeProperties, context, scaleType, multiplier]);

  const handleApplyLocally = useCallback(() => {
    if (onApplyLocally && kebabName) {
      onApplyLocally(kebabName, activeProperties);
    }
  }, [onApplyLocally, kebabName, activeProperties]);

  const isValid = kebabName.length > 0 && !collision && activeProperties.length > 0;

  return (
    <div className="te-token-form">
      {/* Back link */}
      <button
        type="button"
        className="te-token-form-back"
        onClick={onBack}
      >
        &larr; Back
      </button>

      <div className="te-token-form-title">
        Create Token
      </div>

      {/* Source context */}
      <div className="te-token-form-context">
        {context.source === 'deviation' ? (
          <span>From typography deviation on &lt;{context.elementTag}&gt;</span>
        ) : (
          <span>From custom CSS on &lt;{context.elementTag}&gt;</span>
        )}
      </div>

      {/* Token name */}
      <div className="te-token-form-field">
        <label className="te-label">Token Name</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="te-muted">--</span>
          <input
            type="text"
            className="te-text-input"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            placeholder="my-custom-size"
            style={{ flex: 1 }}
          />
        </div>
        {collision && (
          <div className="te-token-form-error">
            Token name already exists in the registry
          </div>
        )}
      </div>

      {/* Property checkboxes */}
      <div className="te-token-form-field">
        <label className="te-label">Properties</label>
        {context.properties.map((p) => {
          const isLocked = context.source === 'deviation' && p.property === 'font-size';
          return (
            <label key={p.property} className="te-token-form-checkbox">
              <input
                type="checkbox"
                checked={selectedProps.has(p.property)}
                onChange={() => toggleProp(p.property)}
                disabled={isLocked}
              />
              <span className="te-token-form-prop-name">{p.property}:</span>
              <span className="te-token-form-prop-value">{p.value}</span>
              {isLocked && <span className="te-muted">(locked)</span>}
            </label>
          );
        })}
      </div>

      {/* Scale relationship (deviation only) */}
      {context.source === 'deviation' && (
        <div className="te-token-form-field">
          <label className="te-label">Scale Relationship</label>
          <div className="te-token-form-radio-group">
            <label className="te-token-form-radio">
              <input
                type="radio"
                name="scaleType"
                value="independent"
                checked={scaleType === 'independent'}
                onChange={() => setScaleType('independent')}
              />
              Independent
            </label>
            <label className="te-token-form-radio">
              <input
                type="radio"
                name="scaleType"
                value="derived"
                checked={scaleType === 'derived'}
                onChange={() => setScaleType('derived')}
              />
              Derived from --font-base
              {scaleType === 'derived' && multiplier && (
                <span className="te-muted" style={{ marginLeft: 4 }}>
                  ({multiplier}&times;)
                </span>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Output preview */}
      {kebabName && activeProperties.length > 0 && (
        <div className="te-token-form-field">
          <label className="te-label">Output Preview</label>
          <pre className="te-diff-content" style={{ fontSize: 10 }}>{outputPreview}</pre>
        </div>
      )}

      {/* Actions */}
      <div className="te-token-form-actions">
        <button
          type="button"
          className="te-btn te-btn-primary"
          onClick={handleCopy}
          disabled={!isValid}
          style={!isValid ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy as CC Prompt'}
        </button>
        {onApplyLocally && (
          <button
            type="button"
            className="te-btn te-btn-secondary"
            onClick={handleApplyLocally}
            disabled={!isValid}
            style={!isValid ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Apply Locally
          </button>
        )}
      </div>
    </div>
  );
}
