'use client';

import { useCallback, useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';

interface TokenEditorDiffOutputProps {
  diff: string;
  changeCount: number;
  onResetAll: () => void;
  classDiff?: string;
  classChangeCount?: number;
  onResetAllClasses?: () => void;
  customStyleDiff?: string;
  customStyleChangeCount?: number;
  onResetCustomStyles?: () => void;
}

export function TokenEditorDiffOutput({
  diff,
  changeCount,
  onResetAll,
  classDiff,
  classChangeCount = 0,
  onResetAllClasses,
  customStyleDiff,
  customStyleChangeCount = 0,
  onResetCustomStyles,
}: TokenEditorDiffOutputProps) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedClass, setCopiedClass] = useState(false);
  const [copiedCustom, setCopiedCustom] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'diff' | 'cc-prompt'>('diff');

  const totalCount = changeCount + classChangeCount + customStyleChangeCount;

  const typeCount = (changeCount > 0 ? 1 : 0) + (classChangeCount > 0 ? 1 : 0) + (customStyleChangeCount > 0 ? 1 : 0);
  const hasBothTypes = typeCount >= 2;

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for contexts where clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, []);

  const handleCopyTokens = useCallback(async () => {
    await copyToClipboard(diff);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  }, [diff, copyToClipboard]);

  const handleCopyClasses = useCallback(async () => {
    await copyToClipboard(classDiff || '');
    setCopiedClass(true);
    setTimeout(() => setCopiedClass(false), 2000);
  }, [classDiff, copyToClipboard]);

  const handleCopyCustom = useCallback(async () => {
    await copyToClipboard(customStyleDiff || '');
    setCopiedCustom(true);
    setTimeout(() => setCopiedCustom(false), 2000);
  }, [customStyleDiff, copyToClipboard]);

  const generateCCPromptFromDiffs = useCallback(() => {
    const sections: string[] = [];
    let sectionNum = 1;

    sections.push('# CC Prompt: Design Token & Class Changes');
    sections.push('');
    sections.push('## Context');
    sections.push('Apply the following design token and class changes to `src/app/globals.css` and related component files.');
    sections.push('');

    if (diff && changeCount > 0) {
      sections.push(`## ${sectionNum}. Token Changes (${changeCount})`);
      sections.push('');
      sections.push('Update the following CSS custom properties in `globals.css`:');
      sections.push('');
      sections.push('```css');
      sections.push(diff);
      sections.push('```');
      sections.push('');
      sectionNum++;
    }

    if (classDiff && classChangeCount > 0) {
      sections.push(`## ${sectionNum}. Class Changes (${classChangeCount})`);
      sections.push('');
      sections.push('Apply the following Tailwind class modifications:');
      sections.push('');
      sections.push('```diff');
      sections.push(classDiff);
      sections.push('```');
      sections.push('');
      sectionNum++;
    }

    if (customStyleDiff && customStyleChangeCount > 0) {
      sections.push(`## ${sectionNum}. Custom Style Changes (${customStyleChangeCount})`);
      sections.push('');
      sections.push('Apply the following inline/custom style changes:');
      sections.push('');
      sections.push('```css');
      sections.push(customStyleDiff);
      sections.push('```');
      sections.push('');
      sectionNum++;
    }

    sections.push('## Validation Checklist');
    sections.push('');
    sections.push('- [ ] All token values updated in `globals.css`');
    if (classChangeCount > 0) sections.push('- [ ] Class changes applied to target components');
    if (customStyleChangeCount > 0) sections.push('- [ ] Custom style overrides applied');
    sections.push('- [ ] `npm run build` passes');
    sections.push('- [ ] Visual regression check in browser');

    return sections.join('\n');
  }, [diff, classDiff, customStyleDiff, changeCount, classChangeCount, customStyleChangeCount]);

  const handleCopyAll = useCallback(async () => {
    const content = outputFormat === 'cc-prompt'
      ? generateCCPromptFromDiffs()
      : [diff, classDiff, customStyleDiff].filter(Boolean).join('\n\n---\n\n');
    await copyToClipboard(content);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [diff, classDiff, customStyleDiff, copyToClipboard, outputFormat, generateCCPromptFromDiffs]);

  if (totalCount === 0) {
    return (
      <div className="te-diff-empty">
        No changes yet. Modify tokens or inspect elements to see a diff.
      </div>
    );
  }

  // Single type of changes — simple view
  if (!hasBothTypes) {
    const isTokens = changeCount > 0;
    const isCustom = !isTokens && customStyleChangeCount > 0;
    const content = isTokens ? diff : isCustom ? (customStyleDiff || '') : (classDiff || '');
    const label = isTokens ? 'token' : isCustom ? 'custom style' : 'class';
    const count = isTokens ? changeCount : isCustom ? customStyleChangeCount : classChangeCount;

    return (
      <div className="te-diff">
        <div className="te-diff-header">
          <span className="te-diff-title">
            {count} {label} change{count !== 1 ? 's' : ''}
          </span>
          <div className="te-diff-actions">
            {isTokens && (
              <button
                type="button"
                className="te-btn te-btn-secondary"
                onClick={onResetAll}
              >
                <RotateCcw size={12} />
                Reset All
              </button>
            )}
            {!isTokens && !isCustom && onResetAllClasses && (
              <button
                type="button"
                className="te-btn te-btn-secondary"
                onClick={onResetAllClasses}
              >
                <RotateCcw size={12} />
                Reset All
              </button>
            )}
            {isCustom && onResetCustomStyles && (
              <button
                type="button"
                className="te-btn te-btn-secondary"
                onClick={onResetCustomStyles}
              >
                <RotateCcw size={12} />
                Reset All
              </button>
            )}
            <button
              type="button"
              className="te-btn te-btn-primary"
              onClick={handleCopyAll}
            >
              {copiedAll ? <Check size={12} /> : <Copy size={12} />}
              {copiedAll ? 'Copied!' : outputFormat === 'cc-prompt' ? 'Copy as CC Prompt' : 'Copy Changes'}
            </button>
          </div>
        </div>
        <div className="te-format-toggle">
          <button
            type="button"
            className={`te-format-btn ${outputFormat === 'diff' ? 'te-format-active' : ''}`}
            onClick={() => setOutputFormat('diff')}
          >
            Diff
          </button>
          <button
            type="button"
            className={`te-format-btn ${outputFormat === 'cc-prompt' ? 'te-format-active' : ''}`}
            onClick={() => setOutputFormat('cc-prompt')}
          >
            CC Prompt
          </button>
        </div>
        <pre className="te-diff-content">{content}</pre>
      </div>
    );
  }

  // Both types — sectioned view
  return (
    <div className="te-diff">
      <div className="te-diff-header">
        <span className="te-diff-title">
          {totalCount} change{totalCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="te-format-toggle">
        <button
          type="button"
          className={`te-format-btn ${outputFormat === 'diff' ? 'te-format-active' : ''}`}
          onClick={() => setOutputFormat('diff')}
        >
          Diff
        </button>
        <button
          type="button"
          className={`te-format-btn ${outputFormat === 'cc-prompt' ? 'te-format-active' : ''}`}
          onClick={() => setOutputFormat('cc-prompt')}
        >
          CC Prompt
        </button>
      </div>

      {/* Token changes section */}
      <div className="te-diff-section">
        <div className="te-diff-section-title">
          Token Changes ({changeCount})
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            <button
              type="button"
              className="te-btn te-btn-secondary"
              onClick={onResetAll}
              style={{ padding: '2px 8px', fontSize: 10 }}
            >
              <RotateCcw size={10} />
              Reset
            </button>
            <button
              type="button"
              className="te-btn te-btn-primary"
              onClick={handleCopyTokens}
              style={{ padding: '2px 8px', fontSize: 10 }}
            >
              {copiedToken ? <Check size={10} /> : <Copy size={10} />}
              {copiedToken ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <pre className="te-diff-content">{diff}</pre>
      </div>

      <div className="te-diff-separator" />

      {/* Class changes section */}
      <div className="te-diff-section">
        <div className="te-diff-section-title">
          Class Changes ({classChangeCount})
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            {onResetAllClasses && (
              <button
                type="button"
                className="te-btn te-btn-secondary"
                onClick={onResetAllClasses}
                style={{ padding: '2px 8px', fontSize: 10 }}
              >
                <RotateCcw size={10} />
                Reset
              </button>
            )}
            <button
              type="button"
              className="te-btn te-btn-primary"
              onClick={handleCopyClasses}
              style={{ padding: '2px 8px', fontSize: 10 }}
            >
              {copiedClass ? <Check size={10} /> : <Copy size={10} />}
              {copiedClass ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <pre className="te-diff-content">{classDiff}</pre>
      </div>

      {/* Custom style changes section */}
      {customStyleChangeCount > 0 && (
        <>
          <div className="te-diff-separator" />
          <div className="te-diff-section">
            <div className="te-diff-section-title">
              Custom Style Changes ({customStyleChangeCount})
              <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                {onResetCustomStyles && (
                  <button
                    type="button"
                    className="te-btn te-btn-secondary"
                    onClick={onResetCustomStyles}
                    style={{ padding: '2px 8px', fontSize: 10 }}
                  >
                    <RotateCcw size={10} />
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  className="te-btn te-btn-primary"
                  onClick={handleCopyCustom}
                  style={{ padding: '2px 8px', fontSize: 10 }}
                >
                  {copiedCustom ? <Check size={10} /> : <Copy size={10} />}
                  {copiedCustom ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <pre className="te-diff-content">{customStyleDiff}</pre>
          </div>
        </>
      )}

      {/* Copy All button */}
      <button
        type="button"
        className="te-btn te-btn-primary te-diff-copy-all"
        onClick={handleCopyAll}
      >
        {copiedAll ? <Check size={12} /> : <Copy size={12} />}
        {copiedAll ? 'Copied All!' : outputFormat === 'cc-prompt' ? 'Copy as CC Prompt' : 'Copy All Changes'}
      </button>
    </div>
  );
}
