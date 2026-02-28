'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ElementInspectorReturn } from '../hooks/use-element-inspector';
import { MousePointer } from 'lucide-react';
// PENDING: This file is refactored in DL-CC04
import { categorizeClasses } from '../core/class-categories';
import { ClassCategoryGroup } from './ClassCategoryGroup';
import { ElementSelectorOverlay } from './ElementSelectorOverlay';
import { InspectorSwitch } from './InspectorSwitch';
import { ClassSuggestionDropdown } from './ClassSuggestionDropdown';
import { getClassDictionary, filterSuggestions } from '../core/class-dictionary';
import { detectConflicts } from '../core/class-conflict-detection';
import { TokenMigrationSuggestions } from './TokenMigrationSuggestions';
import { TypographyAudit } from './TypographyAudit';
import { RawCssInput, type TokenCreationContext } from './RawCssInput';
import { TokenCreationForm } from './TokenCreationForm';

interface ElementInspectorTabProps {
  inspector: ElementInspectorReturn;
  isDetached: boolean;
  scaleBaseline: { isActive: boolean; toggle: () => void };
}

export function ElementInspectorTab({
  inspector,
  isDetached,
  scaleBaseline,
}: ElementInspectorTabProps) {
  const [addValue, setAddValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [tokenFormContext, setTokenFormContext] = useState<TokenCreationContext | null>(null);
  const prevElementRef = useRef<HTMLElement | null>(null);

  // Revert custom styles when inspected element changes
  useEffect(() => {
    const currentEl = inspector.selectedElement;
    if (prevElementRef.current && prevElementRef.current !== currentEl) {
      // Element changed — clear custom styles (reverts via hook)
      if (inspector.customStyles.length > 0) {
        inspector.clearCustomStyles();
      }
      setShowTokenForm(false);
      setTokenFormContext(null);
    }
    prevElementRef.current = currentEl;
  }, [inspector.selectedElement]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-activate selector when inspector tab shows empty state
  useEffect(() => {
    if (!isDetached && !inspector.selectedElement && !inspector.isSelectorActive) {
      inspector.activateSelector();
    }
    // Deactivate selector when tab unmounts (user switches to another tab)
    return () => {
      inspector.deactivateSelector();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const identifier = inspector.selectedElement
    ? inspector.getElementIdentifier()
    : null;

  const categoryGroups = categorizeClasses(inspector.currentClasses);

  const conflicts = useMemo(
    () => detectConflicts(inspector.currentClasses),
    [inspector.currentClasses]
  );

  const handleGeneralAdd = useCallback(() => {
    const trimmed = addValue.trim();
    if (trimmed) {
      inspector.addClass(trimmed);
      setAddValue('');
      setSuggestions([]);
      setShowSuggestions(false);
      // Success flash
      const input = addInputRef.current;
      if (input) {
        input.classList.add('te-add-success');
        setTimeout(() => input.classList.remove('te-add-success'), 300);
        requestAnimationFrame(() => input.focus());
      }
    }
  }, [addValue, inspector]);

  const handleGeneralAddKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Let dropdown handle arrow keys and escape when visible
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Escape') return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleGeneralAdd();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setAddValue('');
        setShowSuggestions(false);
        setSuggestions([]);
        addInputRef.current?.blur();
      }
    },
    [handleGeneralAdd, showSuggestions, suggestions]
  );

  const handleGeneralAddBlur = useCallback(() => {
    setTimeout(() => {
      const trimmed = addValue.trim();
      if (trimmed) {
        inspector.addClass(trimmed);
        setAddValue('');
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);
  }, [addValue, inspector]);

  const handleAddChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddValue(val);
    const dict = getClassDictionary();
    const results = filterSuggestions(dict, val, 30);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }, []);

  const handleSuggestionSelect = useCallback(
    (cls: string) => {
      inspector.addClass(cls);
      setAddValue('');
      setSuggestions([]);
      setShowSuggestions(false);
      requestAnimationFrame(() => addInputRef.current?.focus());
    },
    [inspector]
  );

  const handleCreateToken = useCallback((context: TokenCreationContext) => {
    setTokenFormContext(context);
    setShowTokenForm(true);
  }, []);

  const handleTokenFormBack = useCallback(() => {
    setShowTokenForm(false);
    setTokenFormContext(null);
  }, []);

  // Detached mode — inspector disabled
  if (isDetached) {
    return (
      <div className="te-inspector-empty">
        <p style={{ marginBottom: 4 }}>Inspector requires docked mode.</p>
        <p className="te-muted">
          Detached mode coming in a future update.
        </p>
      </div>
    );
  }

  // No selection — empty state
  if (!inspector.selectedElement || !identifier) {
    return (
      <div className="te-inspector-empty">
        {inspector.isSelectorActive ? (
          <p>Click any element on the page to inspect it</p>
        ) : (
          <>
            <p style={{ marginBottom: 12 }}>
              Select an element to inspect its classes
            </p>
            <button
              type="button"
              className="te-btn te-btn-secondary"
              onClick={() => inspector.activateSelector()}
            >
              <MousePointer size={12} />
              Select Element
            </button>
          </>
        )}
        <ElementSelectorOverlay
          isActive={inspector.isSelectorActive}
          onSelect={inspector.selectElement}
          onDeactivate={() => {
            if (inspector.isSelectorActive) inspector.toggleSelector();
          }}
        />
      </div>
    );
  }

  // Token creation form replaces the main content
  if (showTokenForm && tokenFormContext) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TokenCreationForm
            context={tokenFormContext}
            onBack={handleTokenFormBack}
            onApplyLocally={(tokenName, properties) => {
              // Apply properties as custom styles on the element
              for (const p of properties) {
                inspector.addCustomStyle(p.property, p.value);
              }
              handleTokenFormBack();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Section A — Element info (fixed) */}
      <div className="te-element-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="te-element-tag">&lt;{identifier.tagName}&gt;</span>
          <InspectorSwitch
            checked={inspector.isSelectorActive}
            onChange={inspector.toggleSelector}
            labelOn="Selecting…"
            labelOff="Re-select"
            compact
          />
        </div>
        {identifier.textPreview && (
          <div className="te-element-text">
            &quot;{identifier.textPreview}&quot;
          </div>
        )}
        <div className="te-breadcrumb">
          {identifier.breadcrumb.map((segment, i) => (
            <span key={i}>
              {i > 0 && <span style={{ color: '#45475a', margin: '0 2px' }}>›</span>}
              {segment}
            </span>
          ))}
        </div>
        {identifier.testId && (
          <div className="te-muted" style={{ marginTop: 2 }}>
            data-testid=&quot;{identifier.testId}&quot;
          </div>
        )}
        {identifier.id && (
          <div className="te-muted" style={{ marginTop: 2 }}>
            id=&quot;{identifier.id}&quot;
          </div>
        )}
      </div>

      {/* Section B — Class editor (scrollable) */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {categoryGroups.length === 0 ? (
          <div className="te-muted" style={{ textAlign: 'center', padding: 16 }}>
            No classes on this element.
          </div>
        ) : (
          categoryGroups.map((group) => (
            <ClassCategoryGroup
              key={group.category}
              category={group.category}
              classes={group.classes}
              originalClasses={inspector.originalClasses}
              onUpdate={inspector.updateClass}
              onRemove={inspector.removeClass}
              conflicts={conflicts}
            />
          ))
        )}

        {/* Typography Audit */}
        {inspector.selectedElement && (
          <TypographyAudit
            element={inspector.selectedElement}
            currentClasses={inspector.currentClasses}
            onRemoveClass={inspector.removeClass}
            isBaselineActive={scaleBaseline.isActive}
            onCreateToken={handleCreateToken}
          />
        )}

        {/* Token migration suggestions */}
        <TokenMigrationSuggestions
          classes={inspector.currentClasses}
          onApply={inspector.updateClass}
        />

        {/* Custom Styles (Raw CSS Input) */}
        <div style={{ padding: '8px 0', borderTop: '1px solid #313244', marginTop: 4 }}>
          <RawCssInput
            customStyles={inspector.customStyles}
            onAddStyle={inspector.addCustomStyle}
            onRemoveStyle={inspector.removeCustomStyle}
            onClearAll={inspector.clearCustomStyles}
            onCreateToken={handleCreateToken}
            elementTag={identifier.tagName}
          />
        </div>

        {/* General add class input */}
        <div style={{ padding: '8px 0', borderTop: '1px solid #313244', marginTop: 4 }}>
          <div className="te-class-group-header" style={{ marginBottom: 4 }}>
            <span>Add Class</span>
          </div>
          <div>
            <input
              ref={addInputRef}
              type="text"
              className="te-add-class-input"
              value={addValue}
              onChange={handleAddChange}
              onKeyDown={handleGeneralAddKeyDown}
              onBlur={handleGeneralAddBlur}
              placeholder="Type class name…"
              style={{ width: '100%' }}
            />
            <ClassSuggestionDropdown
              suggestions={suggestions}
              inputValue={addValue}
              onSelect={handleSuggestionSelect}
              onDismiss={() => setShowSuggestions(false)}
              visible={showSuggestions}
              inputRef={addInputRef}
            />
          </div>
        </div>

        {/* Cancel selection */}
        <div style={{ padding: '8px 0', borderTop: '1px solid #313244', marginTop: 4, textAlign: 'center' }}>
          <button
            type="button"
            className="te-btn te-btn-secondary"
            onClick={() => {
              inspector.clearSelection();
              inspector.activateSelector();
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <ElementSelectorOverlay
        isActive={inspector.isSelectorActive}
        onSelect={inspector.selectElement}
        onDeactivate={() => {
          if (inspector.isSelectorActive) inspector.toggleSelector();
        }}
      />
    </div>
  );
}
