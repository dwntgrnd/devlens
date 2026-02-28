'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChipConflictInfo } from '../core/class-conflict-detection';
import { ClassSuggestionDropdown } from './ClassSuggestionDropdown';
import { getClassDictionary, filterSuggestions } from '../core/class-dictionary';

interface ClassChipProps {
  className: string;
  isModified: boolean;
  onUpdate: (oldClass: string, newClass: string) => void;
  onRemove: (className: string) => void;
  conflict?: ChipConflictInfo;
}

export function ClassChip({
  className,
  isModified,
  onUpdate,
  onRemove,
  conflict,
}: ClassChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(className);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setEditValue(className);
    setIsEditing(true);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [className]);

  const commitEdit = useCallback(() => {
    setIsEditing(false);
    setShowSuggestions(false);
    setSuggestions([]);
    const trimmed = editValue.trim();
    if (trimmed === className) return;
    if (!trimmed) {
      onRemove(className);
    } else {
      onUpdate(className, trimmed);
    }
  }, [editValue, className, onUpdate, onRemove]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Let dropdown handle arrow/enter/escape when visible
      if (showSuggestions && suggestions.length > 0) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        commitEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        setEditValue(className);
        setShowSuggestions(false);
        setSuggestions([]);
      }
    },
    [commitEdit, className, showSuggestions, suggestions]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditValue(val);
    const dict = getClassDictionary();
    const results = filterSuggestions(dict, val, 30);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }, []);

  const handleSuggestionSelect = useCallback(
    (cls: string) => {
      setShowSuggestions(false);
      setSuggestions([]);
      setIsEditing(false);
      if (cls !== className) {
        onUpdate(className, cls);
      }
    },
    [className, onUpdate]
  );

  if (isEditing) {
    return (
      <div style={{ display: 'inline-block' }}>
        <input
          ref={inputRef}
          type="text"
          className="te-chip-edit"
          value={editValue}
          onChange={handleInputChange}
          onBlur={() => {
            // Delay to allow dropdown click to fire
            setTimeout(() => {
              if (showSuggestions) return;
              commitEdit();
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: Math.max(60, Math.min(200, editValue.length * 7.5 + 16)),
          }}
        />
        <ClassSuggestionDropdown
          suggestions={suggestions}
          inputValue={editValue}
          onSelect={handleSuggestionSelect}
          onDismiss={() => setShowSuggestions(false)}
          visible={showSuggestions}
          inputRef={inputRef}
        />
      </div>
    );
  }

  const chipClass = [
    'te-chip',
    conflict ? 'te-chip-conflict' : '',
    isModified && !conflict ? 'te-chip-modified' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={chipClass}
      onDoubleClick={handleDoubleClick}
    >
      <span>{className}</span>
      {conflict && (
        <span className="te-chip-tooltip">
          <span className="te-chip-tooltip-text">
            Conflicts with {conflict.conflictsWith.join(', ')} on {conflict.property}
          </span>
          ⚠
        </span>
      )}
      <button
        type="button"
        className="te-chip-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(className);
        }}
        title="Remove class"
      >
        ×
      </button>
    </span>
  );
}
