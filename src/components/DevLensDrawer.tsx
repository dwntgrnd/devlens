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
        >
          <Palette size={22} />
          {scaleBaseline.isActive && (
            <span className="te-trigger-dot-baseline" />
          )}
          {combinedChangeCount > 0 && (
            <span className="te-trigger-badge">
              {combinedChangeCount > 9 ? '9+' : combinedChangeCount}
            </span>
          )}
        </button>
      )}

    </>
  );
}
