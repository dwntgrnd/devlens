'use client';

import { useCallback, useRef, useState } from 'react';
import type { CustomStyleEntry } from '../hooks/use-element-inspector';

export interface TokenCreationContext {
  source: 'deviation' | 'custom-css';
  properties: { property: string; value: string }[];
  elementTag?: string;
  elementPath?: string;
  computedFontSize?: number;
  expectedPx?: number;
  scaleLabel?: string;
}

interface RawCssInputProps {
  customStyles: CustomStyleEntry[];
  onAddStyle: (property: string, value: string) => void;
  onRemoveStyle: (property: string) => void;
  onClearAll: () => void;
  onCreateToken?: (context: TokenCreationContext) => void;
  elementTag?: string;
}

function parseCssInput(input: string): { property: string; value: string }[] {
  const results: { property: string; value: string }[] = [];
  const declarations = input.split(';').filter((s) => s.trim());

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const property = decl.slice(0, colonIdx).trim();
    const value = decl.slice(colonIdx + 1).trim();
    if (property && value) {
      results.push({ property, value });
    }
  }

  return results;
}

export function RawCssInput({
  customStyles,
  onAddStyle,
  onRemoveStyle,
  onClearAll,
  onCreateToken,
  elementTag,
}: RawCssInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [editingProp, setEditingProp] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const parsed = parseCssInput(inputValue);
    for (const { property, value } of parsed) {
      onAddStyle(property, value);
    }
    if (parsed.length > 0) {
      setInputValue('');
    }
  }, [inputValue, onAddStyle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        setInputValue('');
        inputRef.current?.blur();
      }
    },
    [handleSubmit]
  );

  const handleStartEdit = useCallback(
    (property: string, value: string) => {
      setEditingProp(property);
      setEditValue(value);
      requestAnimationFrame(() => editRef.current?.focus());
    },
    []
  );

  const handleEditCommit = useCallback(() => {
    if (editingProp && editValue.trim()) {
      onAddStyle(editingProp, editValue.trim());
    }
    setEditingProp(null);
    setEditValue('');
  }, [editingProp, editValue, onAddStyle]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEditCommit();
      } else if (e.key === 'Escape') {
        setEditingProp(null);
        setEditValue('');
      }
    },
    [handleEditCommit]
  );

  const handleCreateToken = useCallback(() => {
    if (!onCreateToken || customStyles.length === 0) return;
    onCreateToken({
      source: 'custom-css',
      properties: customStyles.map((s) => ({
        property: s.property,
        value: s.value,
      })),
      elementTag,
    });
  }, [onCreateToken, customStyles, elementTag]);

  return (
    <div className="te-raw-css-section">
      <div className="te-class-group-header" style={{ marginBottom: 4 }}>
        <span>Custom Styles</span>
        {customStyles.length > 0 && (
          <button
            type="button"
            className="te-raw-css-clear"
            onClick={onClearAll}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Chips */}
      {customStyles.length > 0 && (
        <div className="te-class-chips" style={{ marginBottom: 6 }}>
          {customStyles.map((entry) => (
            <span key={entry.property} className="te-chip te-chip-custom">
              <span className="te-chip-prop">{entry.property}:</span>
              {editingProp === entry.property ? (
                <input
                  ref={editRef}
                  type="text"
                  className="te-chip-edit"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={handleEditCommit}
                  style={{ width: Math.max(40, editValue.length * 7) }}
                />
              ) : (
                <span
                  className="te-chip-value"
                  onDoubleClick={() => handleStartEdit(entry.property, entry.value)}
                  title="Double-click to edit value"
                >
                  {entry.value}
                </span>
              )}
              <button
                type="button"
                className="te-chip-remove"
                onClick={() => onRemoveStyle(entry.property)}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        className="te-add-class-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="font-size: 18px; color: red"
        style={{ width: '100%' }}
      />

      {/* Create token button */}
      {customStyles.length > 0 && onCreateToken && (
        <button
          type="button"
          className="te-btn te-btn-secondary"
          onClick={handleCreateToken}
          style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}
        >
          Create token &rarr;
        </button>
      )}
    </div>
  );
}
