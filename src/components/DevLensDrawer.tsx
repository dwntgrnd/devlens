'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Palette,
  X,
  PanelLeft,
  PanelRight,
  PanelBottom,
  ExternalLink,
  FileCode,
  MousePointer,
} from 'lucide-react';
import { useTokenEditor } from '../hooks/use-token-editor';
import { useDockPosition, type DockPosition } from '../hooks/use-dock-position';
import { useDetachedWindow } from '../hooks/use-detached-window';
import { useDevLensConfig } from '../hooks/use-devlens-config';
import { TokenEditorControls } from './TokenEditorControls';
import { TokenCreationZone } from './TokenCreationZone';
import { TokenEditorDiffOutput } from './TokenEditorDiffOutput';
import { useElementInspector } from '../hooks/use-element-inspector';
import { useScaleBaseline } from '../hooks/use-scale-baseline';
import { ElementInspectorTab } from './ElementInspectorTab';

const DRAWER_SIZE = 360;

const dockIcons: { pos: DockPosition; icon: typeof PanelLeft; label: string }[] = [
  { pos: 'left', icon: PanelLeft, label: 'Dock left' },
  { pos: 'right', icon: PanelRight, label: 'Dock right' },
  { pos: 'bottom', icon: PanelBottom, label: 'Dock bottom' },
  { pos: 'detached', icon: ExternalLink, label: 'Detach window' },
];

type Tab = 'tokens' | 'inspector' | 'diff';

export function DevLensDrawer() {
  const { dock, setDock, isOpen, setIsOpen } = useDockPosition();
  const { isDetached, detach, reattach } = useDetachedWindow();
  const { previewFontFamily } = useDevLensConfig();
  const editor = useTokenEditor();
  const inspector = useElementInspector();
  const scaleBaseline = useScaleBaseline();
  const [activeTab, setActiveTab] = useState<Tab>('tokens');

  const changeCount = editor.getChangeCount();
  const combinedChangeCount = changeCount + inspector.changeCount + inspector.customStyleChangeCount;

  // Handle dock position change
  const handleDockChange = (pos: DockPosition) => {
    if (pos === 'detached') {
      detach();
      setIsOpen(false);
    } else {
      if (isDetached) reattach();
      setDock(pos);
      setIsOpen(true);
    }
  };

  // Manage body margin for docked panels
  useEffect(() => {
    if (!isOpen || isDetached) {
      document.body.style.marginLeft = '';
      document.body.style.marginRight = '';
      document.body.style.marginBottom = '';
      return;
    }

    const px = `${DRAWER_SIZE}px`;
    if (dock === 'left') {
      document.body.style.marginLeft = px;
      document.body.style.marginRight = '';
      document.body.style.marginBottom = '';
    } else if (dock === 'right') {
      document.body.style.marginRight = px;
      document.body.style.marginLeft = '';
      document.body.style.marginBottom = '';
    } else if (dock === 'bottom') {
      document.body.style.marginBottom = px;
      document.body.style.marginLeft = '';
      document.body.style.marginRight = '';
    }

    return () => {
      document.body.style.marginLeft = '';
      document.body.style.marginRight = '';
      document.body.style.marginBottom = '';
    };
  }, [isOpen, dock, isDetached]);

  const drawerStyle = useMemo(() => {
    const base: Record<string, unknown> = {
      position: 'fixed',
      zIndex: 9999,
      display: isOpen && !isDetached ? 'flex' : 'none',
      flexDirection: 'column',
      background: '#1e1e2e',
      color: '#cdd6f4',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '13px',
      boxShadow: '0 0 20px rgba(0,0,0,0.3)',
      '--devlens-preview-font': previewFontFamily,
    };

    switch (dock) {
      case 'left':
        return { ...base, top: 0, left: 0, bottom: 0, width: DRAWER_SIZE };
      case 'right':
        return { ...base, top: 0, right: 0, bottom: 0, width: DRAWER_SIZE };
      case 'bottom':
        return { ...base, left: 0, right: 0, bottom: 0, height: DRAWER_SIZE };
      default:
        return base;
    }
  }, [dock, isOpen, isDetached, previewFontFamily]);

  return (
    <>
      {/* Drawer panel */}
      <div style={drawerStyle as React.CSSProperties} className="te-drawer">
        {/* Header */}
        <div className="te-header">
          <div className="te-header-title">
            <Palette size={16} />
            <span>DevLens</span>
            {combinedChangeCount > 0 && (
              <span className="te-badge">{combinedChangeCount}</span>
            )}
          </div>

          <div className="te-header-actions">
            {/* Dock position toggles */}
            <div className="te-dock-strip">
              {dockIcons.map(({ pos, icon: Icon, label }) => (
                <button
                  key={pos}
                  type="button"
                  className={`te-dock-btn ${dock === pos ? 'te-dock-active' : ''}`}
                  onClick={() => handleDockChange(pos)}
                  title={label}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>

            <button
              type="button"
              className="te-icon-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab bar — 3 tabs */}
        <div className="te-tabs">
          <button
            type="button"
            className={`te-tab ${activeTab === 'tokens' ? 'te-tab-active' : ''}`}
            onClick={() => setActiveTab('tokens')}
          >
            <Palette size={12} />
            Tokens
          </button>
          <button
            type="button"
            className={`te-tab ${activeTab === 'inspector' ? 'te-tab-active' : ''}`}
            onClick={() => setActiveTab('inspector')}
          >
            <MousePointer size={12} />
            Inspector
            {inspector.changeCount > 0 && (
              <span className="te-badge te-badge-sm">{inspector.changeCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`te-tab ${activeTab === 'diff' ? 'te-tab-active' : ''}`}
            onClick={() => setActiveTab('diff')}
          >
            <FileCode size={12} />
            Changes
            {combinedChangeCount > 0 && (
              <span className="te-badge te-badge-sm">{combinedChangeCount}</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="te-content">
          {activeTab === 'tokens' && (
            <>
              <TokenEditorControls
                registry={editor.registry}
                getCurrentValue={editor.getCurrentValue}
                isModified={editor.isModified}
                updateToken={editor.updateToken}
                resetToken={editor.resetToken}
                getGroupChangeCount={editor.getGroupChangeCount}
                setScaleMetadata={editor.setScaleMetadata}
                scaleBaseline={scaleBaseline}
              />
              <TokenCreationZone />
            </>
          )}
          {activeTab === 'inspector' && (
            <ElementInspectorTab
              inspector={inspector}
              isDetached={isDetached}
              scaleBaseline={scaleBaseline}
            />
          )}
          {activeTab === 'diff' && (
            <TokenEditorDiffOutput
              diff={editor.generateDiff()}
              changeCount={changeCount}
              onResetAll={editor.resetAll}
              classDiff={inspector.classDiffText}
              classChangeCount={inspector.changeCount}
              onResetAllClasses={inspector.clearSelection}
              customStyleDiff={inspector.customStyleDiffText}
              customStyleChangeCount={inspector.customStyleChangeCount}
              onResetCustomStyles={inspector.clearCustomStyles}
            />
          )}
        </div>
      </div>

      {/* Trigger button */}
      {!isOpen && !isDetached && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="te-trigger"
          title="Open DevLens"
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9998,
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: '#1e1e2e',
            color: '#cdd6f4',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          <Palette size={22} />
          {scaleBaseline.isActive && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                left: -2,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#a6e3a1',
              }}
            />
          )}
          {combinedChangeCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#f38ba8',
                fontSize: '9px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e1e2e',
              }}
            >
              {combinedChangeCount > 9 ? '9+' : combinedChangeCount}
            </span>
          )}
        </button>
      )}

      {/* Scoped styles — isolated from the app's design system */}
      <style>{`
        .te-drawer * {
          box-sizing: border-box;
        }

        .te-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-bottom: 1px solid #313244;
          flex-shrink: 0;
        }

        .te-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
        }

        .te-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .te-dock-strip {
          display: flex;
          gap: 2px;
          background: #313244;
          padding: 2px;
          border-radius: 6px;
        }

        .te-dock-btn {
          padding: 4px 6px;
          border: none;
          background: transparent;
          color: #a6adc8;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .te-dock-btn:hover {
          color: #cdd6f4;
          background: #45475a;
        }

        .te-dock-active {
          background: #45475a !important;
          color: #89b4fa !important;
        }

        .te-tabs {
          display: flex;
          border-bottom: 1px solid #313244;
          flex-shrink: 0;
        }

        .te-tab {
          flex: 1;
          padding: 8px;
          border: none;
          background: transparent;
          color: #a6adc8;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-bottom: 2px solid transparent;
          font-family: inherit;
        }

        .te-tab:hover {
          color: #cdd6f4;
        }

        .te-tab-active {
          color: #89b4fa;
          border-bottom-color: #89b4fa;
        }

        .te-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .te-badge {
          background: #f38ba8;
          color: #1e1e2e;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .te-badge-sm {
          font-size: 9px;
          padding: 0 4px;
          min-width: 14px;
        }

        /* Accordion overrides */
        .te-accordion {
          border: none !important;
        }

        .te-accordion-item {
          border-color: #313244 !important;
        }

        .te-accordion-trigger {
          padding: 8px 4px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #cdd6f4 !important;
          text-decoration: none !important;
          font-family: inherit !important;
        }

        .te-accordion-trigger:hover {
          text-decoration: none !important;
          color: #89b4fa !important;
        }

        .te-accordion-trigger svg {
          color: #6c7086 !important;
        }

        .te-accordion-content {
          font-size: 13px !important;
        }

        .te-change-badge {
          background: #fab387;
          color: #1e1e2e;
          font-size: 9px;
          font-weight: 700;
          padding: 0 5px;
          border-radius: 8px;
          margin-left: 6px;
        }

        .te-token-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Token controls */
        .te-control {
          padding: 8px;
          background: #181825;
          border-radius: 6px;
          border: 1px solid #313244;
        }

        .te-control-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .te-label {
          font-size: 11px;
          font-weight: 600;
          color: #bac2de;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .te-modified-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #fab387;
          display: inline-block;
        }

        .te-control-actions {
          display: flex;
          gap: 4px;
        }

        .te-icon-btn {
          padding: 4px;
          border: none;
          background: transparent;
          color: #6c7086;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .te-icon-btn:hover {
          color: #cdd6f4;
          background: #313244;
        }

        .te-reset-btn:hover {
          color: #f38ba8 !important;
        }

        .te-muted {
          color: #6c7086;
          font-size: 11px;
        }

        /* Color control */
        .te-color-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 6px;
        }

        .te-color-swatch {
          width: 32px;
          height: 32px;
          border: 1px solid #45475a;
          border-radius: 4px;
          cursor: pointer;
          padding: 0;
          background: none;
        }

        .te-color-swatch::-webkit-color-swatch-wrapper {
          padding: 2px;
        }

        .te-color-swatch::-webkit-color-swatch {
          border: none;
          border-radius: 2px;
        }

        /* Inputs */
        .te-text-input {
          background: #11111b;
          border: 1px solid #313244;
          color: #cdd6f4;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          outline: none;
        }

        .te-text-input:focus {
          border-color: #89b4fa;
        }

        .te-hex-input {
          width: 80px;
        }

        .te-num-input {
          width: 72px;
        }

        .te-select {
          background: #11111b;
          border: 1px solid #313244;
          color: #cdd6f4;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: inherit;
          outline: none;
          cursor: pointer;
        }

        .te-select:focus {
          border-color: #89b4fa;
        }

        .te-select-full {
          width: 100%;
        }

        /* Sliders */
        .te-slider-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .te-slider-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .te-slider-label {
          width: 12px;
          font-size: 10px;
          font-weight: 700;
          color: #6c7086;
          text-align: center;
        }

        .te-slider-value {
          width: 40px;
          font-size: 10px;
          color: #a6adc8;
          text-align: right;
          font-family: monospace;
        }

        .te-slider {
          flex: 1;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: #313244;
          border-radius: 2px;
          outline: none;
        }

        .te-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #89b4fa;
          cursor: pointer;
        }

        .te-slider-full {
          width: 100%;
          margin-top: 4px;
        }

        /* Length control */
        .te-length-row {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
        }

        /* Font preview */
        .te-font-preview {
          margin-top: 6px;
          padding: 4px 8px;
          background: #11111b;
          border-radius: 4px;
          color: #cdd6f4;
          font-family: var(--devlens-preview-font, inherit);
        }

        /* Shadow preview */
        .te-shadow-preview {
          margin-top: 8px;
          width: 100%;
          height: 24px;
          background: #313244;
          border-radius: 4px;
        }

        /* Diff output */
        .te-diff {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .te-diff-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .te-diff-title {
          font-weight: 600;
          font-size: 13px;
        }

        .te-diff-actions {
          display: flex;
          gap: 6px;
        }

        .te-diff-empty {
          color: #6c7086;
          text-align: center;
          padding: 32px 16px;
          font-size: 13px;
        }

        .te-diff-content {
          background: #11111b;
          border: 1px solid #313244;
          border-radius: 6px;
          padding: 12px;
          font-size: 11px;
          font-family: monospace;
          color: #a6e3a1;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
          margin: 0;
        }

        .te-diff-section {
          margin-bottom: 12px;
        }

        .te-diff-section-title {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
          color: #a6adc8;
          display: flex;
          align-items: center;
        }

        /* Buttons */
        .te-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          font-family: inherit;
        }

        .te-btn-primary {
          background: #89b4fa;
          color: #1e1e2e;
          border-color: #89b4fa;
        }

        .te-btn-primary:hover {
          background: #74c7ec;
        }

        .te-btn-secondary {
          background: transparent;
          color: #a6adc8;
          border-color: #45475a;
        }

        .te-btn-secondary:hover {
          background: #313244;
          color: #cdd6f4;
        }

        /* Modular Scale Controls */
        .te-scale {
          display: flex;
          flex-direction: column;
        }

        .te-scale-reset-row {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 4px;
        }

        .te-scale-control-row {
          display: flex;
          flex-direction: column;
        }

        .te-scale-preview {
          background: #11111b;
          border-radius: 6px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .te-scale-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid #313244;
        }

        .te-scale-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 3px 0;
        }

        .te-scale-sample {
          color: #cdd6f4;
          font-family: var(--devlens-preview-font, inherit);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }

        .te-scale-meta {
          display: flex;
          align-items: baseline;
          gap: 8px;
          flex-shrink: 0;
        }

        .te-scale-px {
          font-size: 11px;
          color: #a6adc8;
          font-family: monospace;
        }

        .te-scale-step {
          font-size: 10px;
          color: #6c7086;
          font-family: monospace;
          width: 28px;
          text-align: right;
        }

        /* Managed-by-scale read-only rows */
        .te-managed-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          background: #181825;
          border-radius: 6px;
          border: 1px solid #313244;
          opacity: 0.7;
        }

        .te-managed-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .te-managed-value {
          font-size: 11px;
          font-family: monospace;
          color: #a6adc8;
        }

        .te-managed-badge {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 1px 5px;
          border-radius: 4px;
          background: #313244;
          color: #6c7086;
        }

        /* Usage hint tooltip */
        .te-usage-hint {
          position: relative;
          display: inline-flex;
          align-items: center;
          color: #6c7086;
          cursor: help;
        }

        .te-usage-hint-tooltip {
          display: none;
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: #313244;
          color: #cdd6f4;
          font-size: 10px;
          font-weight: 400;
          text-transform: none;
          letter-spacing: normal;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 10;
        }

        .te-usage-hint:hover .te-usage-hint-tooltip {
          display: block;
        }

        /* ===== Inspector styles ===== */

        .te-inspector-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          color: #6c7086;
          text-align: center;
          font-size: 13px;
        }

        .te-selector-toggle {
          border-color: #45475a;
        }

        .te-selector-active {
          border-color: #89b4fa !important;
          color: #89b4fa !important;
          background: rgba(137, 180, 250, 0.1) !important;
          animation: te-pulse 1.5s ease-in-out infinite;
        }

        @keyframes te-pulse {
          0%, 100% { border-color: #89b4fa; }
          50% { border-color: transparent; }
        }

        .te-element-info {
          border-bottom: 1px solid #313244;
          padding: 8px 0;
          margin-bottom: 8px;
        }

        .te-element-tag {
          font-family: monospace;
          color: #89b4fa;
          font-size: 14px;
          font-weight: 600;
        }

        .te-element-text {
          color: #6c7086;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }

        .te-breadcrumb {
          display: inline-flex;
          flex-wrap: wrap;
          font-family: monospace;
          font-size: 11px;
          color: #6c7086;
          gap: 0;
          margin-top: 4px;
        }

        .te-class-group {
          margin-bottom: 12px;
        }

        .te-class-group-header {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6c7086;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .te-class-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .te-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: monospace;
          font-size: 11px;
          background: #181825;
          border: 1px solid #313244;

          padding: 2px 6px;
          border-radius: 4px;
          position: relative;
          cursor: default;
          color: #cdd6f4;
        }

        .te-chip-modified {
          background: rgba(250, 179, 135, 0.15);
          border-color: #fab387;
        }

        .te-chip-remove {
          display: none;
          font-size: 14px;
          color: #6c7086;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
          line-height: 1;
        }

        .te-chip:hover .te-chip-remove {
          display: inline-flex;
        }

        .te-chip-remove:hover {
          color: #f38ba8;
        }

        .te-chip-edit {
          font-family: monospace;
          font-size: 11px;
          background: #11111b;
          border: 1px solid #89b4fa;
          color: #cdd6f4;
          padding: 2px 6px;
          border-radius: 4px;
          outline: none;
        }

        .te-chip-add-btn {
          border: none;
          background: none;
          color: #6c7086;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          display: flex;
          align-items: center;
        }

        .te-chip-add-btn:hover {
          color: #89b4fa;
          background: #313244;
        }

        .te-add-class-input {
          font-family: monospace;
          font-size: 11px;
          background: #11111b;
          border: 1px solid #313244;
          color: #cdd6f4;
          padding: 2px 6px;
          border-radius: 4px;
          outline: none;
        }

        .te-add-class-input:focus {
          border-color: #89b4fa;
        }

        .te-add-success {
          border-color: #a6e3a1 !important;
          transition: border-color 300ms ease;
        }

        /* ===== Diff separator & copy all ===== */

        .te-diff-separator {
          border-top: 1px dashed #45475a;
          margin: 8px 0;
        }

        .te-diff-copy-all {
          width: 100%;
          justify-content: center;
          margin-top: 8px;
        }

        /* ===== Inspector Switch ===== */

        .te-switch {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          border: none;
          background: transparent;
          padding: 4px 0;
          font-family: inherit;
        }

        .te-switch-compact {
          gap: 6px;
        }

        .te-switch-track {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 2px;
          transition: background 200ms ease;
          flex-shrink: 0;
        }

        .te-switch-thumb {
          background: #cdd6f4;
          border-radius: 50%;
          transition: transform 200ms ease;
        }

        .te-switch-label {
          font-size: 11px;
          font-weight: 600;
          font-family: monospace;
          transition: color 200ms ease;
          white-space: nowrap;
        }

        .te-switch-active .te-switch-track {
          animation: te-pulse 1.5s ease-in-out infinite;
        }

        /* ===== Suggestion Dropdown ===== */

        .te-suggest-dropdown {
          /* Position set via inline styles (fixed) to escape overflow clipping */
          z-index: 10001;
        }

        .te-suggest-item {
          padding: 4px 8px;
          font-family: monospace;
          font-size: 11px;
          color: #cdd6f4;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .te-suggest-item:hover,
        .te-suggest-item-active {
          background: #313244;
          color: #89b4fa;
        }

        .te-suggest-match {
          color: #89b4fa;
          font-weight: 700;
        }

        /* ===== Conflict Detection ===== */

        .te-chip-conflict {
          background: rgba(249, 226, 175, 0.15);
          border-color: #f9e2af;
        }

        .te-conflict-warning {
          color: #f9e2af;
          font-size: 12px;
        }

        .te-chip-tooltip {
          position: relative;
          display: inline-flex;
          align-items: center;
          color: #f9e2af;
          font-size: 10px;
          cursor: help;
          margin-left: 2px;
        }

        .te-chip-tooltip-text {
          display: none;
          position: absolute;
          bottom: calc(100% + 6px);
          left: 50%;
          transform: translateX(-50%);
          background: #313244;
          color: #cdd6f4;
          font-size: 10px;
          font-weight: 400;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 10002;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .te-chip-tooltip:hover .te-chip-tooltip-text {
          display: block;
        }

        /* ===== Token Migration Suggestions ===== */

        .te-migration-section {
          margin: 8px 0;
          padding: 8px;
          background: #181825;
          border-radius: 6px;
          border: 1px solid #313244;
        }

        .te-migration-header {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6c7086;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .te-migration-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          border-radius: 4px;
          cursor: pointer;
          font-family: monospace;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .te-migration-row:hover {
          background: #313244;
        }

        .te-migration-from {
          color: #f38ba8;
          text-decoration: line-through;
          opacity: 0.9;
        }

        .te-migration-arrow {
          color: #6c7086;
          flex-shrink: 0;
        }

        .te-migration-to {
          color: #a6e3a1;
        }

        .te-migration-confidence {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 1px 4px;
          border-radius: 3px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .te-migration-confidence[data-confidence="high"] {
          background: rgba(166, 227, 161, 0.15);
          color: #a6e3a1;
        }

        .te-migration-confidence[data-confidence="medium"] {
          background: rgba(249, 226, 175, 0.15);
          color: #f9e2af;
        }

        .te-migration-dismiss {
          border: none;
          background: none;
          color: #6c7086;
          cursor: pointer;
          font-size: 14px;
          padding: 0 2px;
          line-height: 1;
          flex-shrink: 0;
        }

        .te-migration-dismiss:hover {
          color: #f38ba8;
        }

        /* ===== Typography Audit ===== */

        .te-typo-audit {
          margin: 8px 0;
          padding: 8px;
          background: #181825;
          border-radius: 6px;
          border: 1px solid #313244;
        }

        .te-typo-audit-header {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6c7086;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .te-typo-status {
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .te-typo-detail {
          font-size: 11px;
          color: #a6adc8;
          font-family: monospace;
          margin-bottom: 2px;
        }

        .te-typo-detail-muted {
          font-size: 11px;
          color: #6c7086;
          font-family: monospace;
          margin-bottom: 2px;
        }

        .te-typo-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          padding-top: 6px;
          border-top: 1px solid #313244;
        }

        /* ===== Raw CSS Input ===== */

        .te-raw-css-section {
          padding: 0;
        }

        .te-raw-css-clear {
          border: none;
          background: none;
          color: #89b4fa;
          cursor: pointer;
          font-size: 10px;
          font-family: inherit;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .te-raw-css-clear:hover {
          color: #74c7ec;
        }

        .te-chip-custom {
          border-left: 2px solid #89b4fa;
        }

        .te-chip-prop {
          color: #89b4fa;
          font-weight: 600;
          margin-right: 2px;
        }

        .te-chip-value {
          cursor: text;
        }

        .te-chip-value:hover {
          text-decoration: underline dotted;
          text-underline-offset: 2px;
        }

        /* ===== Token Creation Form ===== */

        .te-token-form {
          padding: 4px 0;
        }

        .te-token-form-back {
          border: none;
          background: none;
          color: #89b4fa;
          cursor: pointer;
          font-size: 11px;
          font-family: inherit;
          padding: 2px 0;
          margin-bottom: 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .te-token-form-back:hover {
          color: #74c7ec;
          text-decoration: underline;
        }

        .te-token-form-title {
          font-size: 14px;
          font-weight: 600;
          color: #cdd6f4;
          margin-bottom: 4px;
        }

        .te-token-form-context {
          font-size: 11px;
          color: #6c7086;
          margin-bottom: 12px;
          font-family: monospace;
        }

        .te-token-form-field {
          margin-bottom: 12px;
        }

        .te-token-form-field .te-label {
          margin-bottom: 4px;
        }

        .te-token-form-error {
          color: #f38ba8;
          font-size: 10px;
          margin-top: 2px;
        }

        .te-token-form-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-family: monospace;
          color: #cdd6f4;
          padding: 2px 0;
          cursor: pointer;
        }

        .te-token-form-checkbox input[type="checkbox"] {
          margin: 0;
          cursor: pointer;
        }

        .te-token-form-prop-name {
          color: #89b4fa;
        }

        .te-token-form-prop-value {
          color: #a6adc8;
        }

        .te-token-form-radio-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .te-token-form-radio {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #cdd6f4;
          cursor: pointer;
        }

        .te-token-form-radio input[type="radio"] {
          margin: 0;
          cursor: pointer;
        }

        .te-token-form-actions {
          display: flex;
          gap: 6px;
          margin-top: 12px;
        }

        /* ===== Token Creation Zone ===== */

        .te-creation-zone {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #313244;
        }

        .te-creation-trigger {
          width: 100%;
          justify-content: center;
          font-size: 11px;
          opacity: 0.6;
        }

        .te-creation-trigger:hover {
          opacity: 1;
        }

        .te-creation-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .te-creation-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .te-creation-title {
          font-size: 14px;
          font-weight: 600;
          color: #cdd6f4;
        }

        .te-creation-cancel {
          border: none;
          background: none;
          color: #89b4fa;
          cursor: pointer;
          font-size: 11px;
          font-family: inherit;
          padding: 2px 0;
        }

        .te-creation-cancel:hover {
          color: #74c7ec;
          text-decoration: underline;
        }

        .te-creation-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .te-creation-row .te-control {
          padding: 0;
          margin: 0;
          background: none;
          border: none;
        }

        .te-creation-row-label {
          font-size: 11px;
          font-weight: 600;
          color: #bac2de;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .te-creation-swatch {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid #45475a;
          flex-shrink: 0;
        }

        /* ===== Format Toggle ===== */

        .te-format-toggle {
          display: flex;
          background: #313244;
          border-radius: 6px;
          padding: 2px;
          margin-bottom: 8px;
        }

        .te-format-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: #6c7086;
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
        }

        .te-format-btn:hover {
          color: #a6adc8;
        }

        .te-format-active {
          background: #45475a;
          color: #cdd6f4;
        }
      `}</style>
    </>
  );
}
