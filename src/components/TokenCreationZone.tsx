'use client';

import { useCallback, useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { TOKEN_GROUPS } from '../config/token-groups';
import { useDevLensConfig } from '../hooks/use-devlens-config';
import { autoDetectTokens } from '../core/auto-detect';
import { buildRegistry } from '../core/token-registry';
import { generateCCPrompt } from '../core/cc-prompt-generator';
import { HslColorControl } from './HslColorControl';
import { LengthControl } from './LengthControl';

type TokenType = 'hsl-color' | 'font-size' | 'length' | 'shadow';

interface TypeOption {
  value: TokenType;
  label: string;
  placeholder: string;
  defaultGroup: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { value: 'hsl-color', label: 'Color (HSL)', placeholder: 'hsl(210 40% 50%)', defaultGroup: 'Semantic Colors' },
  { value: 'font-size', label: 'Font Size', placeholder: '16px', defaultGroup: 'Typography Scale' },
  { value: 'length', label: 'Length / Spacing', placeholder: '1rem', defaultGroup: 'Spacing & Layout' },
  { value: 'shadow', label: 'Shadow', placeholder: '0 1px 3px 0 rgb(0 0 0 / 0.1)', defaultGroup: 'Shadows' },
];

function toKebab(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const DEFAULT_VALUES: Record<TokenType, string> = {
  'hsl-color': '210 40% 50%',
  'font-size': '16px',
  'length': '1rem',
  'shadow': '',
};

const PROPERTY_FOR_TYPE: Record<TokenType, string> = {
  'hsl-color': 'color',
  'font-size': 'font-size',
  'length': 'padding',
  'shadow': 'box-shadow',
};

export function TokenCreationZone() {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenType, setTokenType] = useState<TokenType>('hsl-color');
  const [tokenName, setTokenName] = useState('');
  const [group, setGroup] = useState(TYPE_OPTIONS[0].defaultGroup);
  const [value, setValue] = useState(DEFAULT_VALUES['hsl-color']);
  const [copied, setCopied] = useState(false);

  const { tokenOverrides, tokenGroups: extraGroups } = useDevLensConfig();

  const registry = useMemo(
    () => buildRegistry(autoDetectTokens(), tokenOverrides),
    [tokenOverrides],
  );

  const allGroups = useMemo(() => {
    const groups = [...TOKEN_GROUPS] as string[];
    if (extraGroups) {
      for (const g of extraGroups) {
        if (!groups.includes(g)) groups.push(g);
      }
    }
    return groups;
  }, [extraGroups]);

  const kebabName = toKebab(tokenName);
  const currentTypeOption = TYPE_OPTIONS.find((t) => t.value === tokenType)!;

  const collision = useMemo(() => {
    if (!kebabName) return false;
    return `--${kebabName}` in registry;
  }, [kebabName, registry]);

  const outputPreview = useMemo(() => {
    if (!kebabName || !value) return '';
    const prop = PROPERTY_FOR_TYPE[tokenType];
    const lines: string[] = [];

    lines.push('/* :root */');
    lines.push(`--${kebabName}: ${value};`);
    lines.push('');
    lines.push('/* @theme inline */');
    if (tokenType === 'font-size') {
      lines.push(`--font-size-${kebabName}: var(--${kebabName});`);
    } else {
      lines.push(`--${kebabName}: var(--${kebabName});`);
    }
    lines.push('');
    lines.push('/* token-registry.ts */');
    lines.push(`'--${kebabName}': { label: '...', group: '${group}', type: '${tokenType}' },`);

    return lines.join('\n');
  }, [kebabName, value, tokenType, group]);

  const handleTypeChange = useCallback((newType: TokenType) => {
    setTokenType(newType);
    const opt = TYPE_OPTIONS.find((t) => t.value === newType)!;
    setGroup(opt.defaultGroup);
    setValue(DEFAULT_VALUES[newType]);
  }, []);

  const handleNameChange = useCallback((raw: string) => {
    setTokenName(toKebab(raw));
  }, []);

  const handleCopy = useCallback(async () => {
    const prop = PROPERTY_FOR_TYPE[tokenType];
    const prompt = generateCCPrompt({
      tokenName: kebabName,
      properties: [{ property: prop, value }],
      context: 'custom-css',
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
  }, [kebabName, tokenType, value]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setTokenType('hsl-color');
    setTokenName('');
    setGroup(TYPE_OPTIONS[0].defaultGroup);
    setValue('');
    setCopied(false);
  }, []);

  const isValid = kebabName.length > 0 && !collision && value.length > 0;

  if (!isOpen) {
    return (
      <div className="te-creation-zone">
        <button
          type="button"
          className="te-btn te-btn-secondary te-creation-trigger"
          onClick={() => setIsOpen(true)}
        >
          + New Token
        </button>
      </div>
    );
  }

  return (
    <div className="te-creation-zone">
      <div className="te-creation-form">
        {/* Header */}
        <div className="te-creation-header">
          <span className="te-creation-title">Create Token</span>
          <button
            type="button"
            className="te-creation-cancel"
            onClick={handleCancel}
          >
            &larr; Cancel
          </button>
        </div>

        {/* Type */}
        <div className="te-creation-row">
          <label className="te-creation-row-label">Type</label>
          <select
            className="te-select te-select-full"
            value={tokenType}
            onChange={(e) => handleTypeChange(e.target.value as TokenType)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div className="te-creation-row">
          <label className="te-creation-row-label">Name</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
            <span className="te-muted">--</span>
            <input
              type="text"
              className="te-text-input"
              value={tokenName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="my-custom-token"
              style={{ flex: 1 }}
            />
          </div>
          {collision && (
            <div className="te-token-form-error">
              Token already exists in the registry
            </div>
          )}
        </div>

        {/* Group */}
        <div className="te-creation-row">
          <label className="te-creation-row-label">Group</label>
          <select
            className="te-select te-select-full"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            {allGroups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Value */}
        <div className="te-creation-row">
          <label className="te-creation-row-label">Value</label>
          {tokenType === 'hsl-color' && (
            <HslColorControl
              label={<></>}
              value={value}
              isModified={false}
              onChange={setValue}
              onReset={() => setValue(DEFAULT_VALUES['hsl-color'])}
            />
          )}
          {tokenType === 'font-size' && (
            <LengthControl
              label={<></>}
              value={value}
              isModified={false}
              onChange={setValue}
              onReset={() => setValue(DEFAULT_VALUES['font-size'])}
              isFontSize={true}
            />
          )}
          {tokenType === 'length' && (
            <LengthControl
              label={<></>}
              value={value}
              isModified={false}
              onChange={setValue}
              onReset={() => setValue(DEFAULT_VALUES['length'])}
              isFontSize={false}
            />
          )}
          {tokenType === 'shadow' && (
            <input
              type="text"
              className="te-text-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={currentTypeOption.placeholder}
              style={{ width: '100%' }}
            />
          )}
        </div>

        {/* Output preview */}
        {kebabName && value && (
          <div className="te-creation-row">
            <label className="te-creation-row-label">Preview</label>
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
        </div>
      </div>
    </div>
  );
}
