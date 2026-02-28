'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './Accordion';
import { getTokensByGroup, type TokenDefinition } from '../core/token-registry';
import { HslColorControl } from './HslColorControl';
import { LengthControl } from './LengthControl';
import { ShadowControl } from './ShadowControl';
import { ModularScaleControl } from './ModularScaleControl';
import type { ScaleMetadata } from '../hooks/use-token-editor';
import { Info } from 'lucide-react';

interface TokenEditorControlsProps {
  registry: Record<string, TokenDefinition>;
  getCurrentValue: (cssVar: string) => string;
  isModified: (cssVar: string) => boolean;
  updateToken: (cssVar: string, value: string) => void;
  resetToken: (cssVar: string) => void;
  getGroupChangeCount: (tokens: TokenDefinition[]) => number;
  setScaleMetadata: (meta: ScaleMetadata) => void;
  scaleBaseline: { isActive: boolean; toggle: () => void };
}

function TokenLabel({ label, usedBy }: { label: string; usedBy?: string[] }) {
  if (!usedBy || usedBy.length === 0) {
    return <>{label}</>;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {label}
      <span className="te-usage-hint">
        <Info size={10} />
        <span className="te-usage-hint-tooltip">
          {usedBy.join(', ')}
        </span>
      </span>
    </span>
  );
}

export function TokenEditorControls({
  registry,
  getCurrentValue,
  isModified,
  updateToken,
  resetToken,
  getGroupChangeCount,
  setScaleMetadata,
  scaleBaseline,
}: TokenEditorControlsProps) {
  const groups = getTokensByGroup(registry);

  return (
    <Accordion type="single" collapsible className="te-accordion">
      {groups.map(({ group: groupName, tokens }) => {
        const changeCount = getGroupChangeCount(tokens);

        if (groupName === 'Modular Type Scale') {
          return (
            <AccordionItem key={groupName} value={groupName} className="te-accordion-item">
              <AccordionTrigger className="te-accordion-trigger">
                <span>
                  Modular Type Scale
                  {changeCount > 0 && (
                    <span className="te-change-badge">{changeCount}</span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="te-accordion-content">
                <ModularScaleControl
                  getCurrentValue={getCurrentValue}
                  isModified={isModified}
                  updateToken={updateToken}
                  resetToken={resetToken}
                  setScaleMetadata={setScaleMetadata}
                  scaleBaseline={scaleBaseline}
                />
              </AccordionContent>
            </AccordionItem>
          );
        }

        return (
          <AccordionItem key={groupName} value={groupName} className="te-accordion-item">
            <AccordionTrigger className="te-accordion-trigger">
              <span>
                {groupName}
                {changeCount > 0 && (
                  <span className="te-change-badge">{changeCount}</span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="te-accordion-content">
              <div className="te-token-list">
                {tokens.map((token) => {
                  // Managed-by-scale tokens outside their group render as read-only
                  if (token.managedByScale && groupName !== 'Modular Type Scale') {
                    const value = getCurrentValue(token.name);
                    return (
                      <div key={token.name} className="te-managed-row">
                        <span className="te-label">
                          <TokenLabel label={token.label} usedBy={token.usedBy} />
                        </span>
                        <span className="te-managed-meta">
                          <span className="te-managed-value">{value || token.value}</span>
                          <span className="te-managed-badge">scale</span>
                        </span>
                      </div>
                    );
                  }

                  const value = getCurrentValue(token.name);
                  const modified = isModified(token.name);
                  const labelNode = (
                    <TokenLabel label={token.label} usedBy={token.usedBy} />
                  );

                  switch (token.type) {
                    case 'hsl-color':
                      return (
                        <HslColorControl
                          key={token.name}
                          label={labelNode}
                          value={value}
                          isModified={modified}
                          onChange={(v) => updateToken(token.name, v)}
                          onReset={() => resetToken(token.name)}
                        />
                      );
                    case 'length':
                      return (
                        <LengthControl
                          key={token.name}
                          label={labelNode}
                          value={value}
                          isModified={modified}
                          onChange={(v) => updateToken(token.name, v)}
                          onReset={() => resetToken(token.name)}
                        />
                      );
                    case 'font-size':
                      return (
                        <LengthControl
                          key={token.name}
                          label={labelNode}
                          value={value}
                          isModified={modified}
                          onChange={(v) => updateToken(token.name, v)}
                          onReset={() => resetToken(token.name)}
                          isFontSize
                        />
                      );
                    case 'shadow':
                      return (
                        <ShadowControl
                          key={token.name}
                          label={labelNode}
                          value={value}
                          isModified={modified}
                          onChange={(v) => updateToken(token.name, v)}
                          onReset={() => resetToken(token.name)}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
