/**
 * CC Prompt Generator — generates structured markdown CC prompts
 * for formalizing style deviations as design tokens.
 */

export interface TokenProperty {
  property: string;
  value: string;
  locked?: boolean;
}

export interface TokenPromptConfig {
  tokenName: string;
  properties: TokenProperty[];
  context: 'deviation' | 'custom-css';
  elementTag?: string;
  elementPath?: string;
  scaleRelationship?: {
    type: 'independent' | 'derived';
    baseVar?: string;
    multiplier?: number;
  };
}

export function generateCCPrompt(config: TokenPromptConfig): string {
  const lines: string[] = [];

  lines.push(`# CC Prompt: Create Token \`--${config.tokenName}\``);
  lines.push('');
  lines.push('## Context');
  lines.push('');

  if (config.context === 'deviation') {
    lines.push('A typography deviation was identified via the DevLens Element Inspector.');
    if (config.elementTag) {
      lines.push(`Element: \`<${config.elementTag}>\``);
    }
    if (config.elementPath) {
      lines.push(`Path: \`${config.elementPath}\``);
    }
  } else {
    lines.push('Custom CSS was applied via the DevLens Raw CSS Input and needs formalization as a design token.');
    if (config.elementTag) {
      lines.push(`Element: \`<${config.elementTag}>\``);
    }
  }

  lines.push('');
  lines.push('## Token Definition');
  lines.push('');
  lines.push(`**Name:** \`--${config.tokenName}\``);
  lines.push('');
  lines.push('**Properties:**');
  lines.push('');

  for (const prop of config.properties) {
    lines.push(`- \`${prop.property}: ${prop.value}\`${prop.locked ? ' (locked)' : ''}`);
  }

  if (config.scaleRelationship) {
    lines.push('');
    lines.push('**Scale Relationship:**');
    if (config.scaleRelationship.type === 'independent') {
      lines.push('- Independent (not derived from modular scale)');
    } else {
      lines.push(`- Derived from \`${config.scaleRelationship.baseVar || '--font-base'}\``);
      if (config.scaleRelationship.multiplier !== undefined) {
        lines.push(`- Multiplier: ${config.scaleRelationship.multiplier}`);
      }
    }
  }

  lines.push('');
  lines.push('## Implementation Steps');
  lines.push('');
  lines.push('1. Add CSS variable to `src/app/globals.css` under `:root`:');
  lines.push('');
  lines.push('```css');

  if (config.scaleRelationship?.type === 'derived' && config.scaleRelationship.multiplier) {
    const baseVar = config.scaleRelationship.baseVar || '--font-base';
    lines.push(`:root {`);
    for (const prop of config.properties) {
      lines.push(`  --${config.tokenName}-${prop.property}: calc(var(${baseVar}) * ${config.scaleRelationship.multiplier});`);
    }
    lines.push(`}`);
  } else {
    lines.push(`:root {`);
    for (const prop of config.properties) {
      lines.push(`  --${config.tokenName}-${prop.property}: ${prop.value};`);
    }
    lines.push(`}`);
  }

  lines.push('```');
  lines.push('');
  lines.push('2. Register in `@theme inline` block (if using Tailwind v4):');
  lines.push('');
  lines.push('```css');
  lines.push('@theme inline {');
  for (const prop of config.properties) {
    lines.push(`  --${config.tokenName}-${prop.property}: var(--${config.tokenName}-${prop.property});`);
  }
  lines.push('}');
  lines.push('```');
  lines.push('');
  lines.push('3. Add to `src/components/dev/token-editor/token-registry.ts` `TOKEN_OVERRIDES`:');
  lines.push('');
  lines.push('```typescript');
  for (const prop of config.properties) {
    lines.push(`'--${config.tokenName}-${prop.property}': {`);
    lines.push(`  label: '${kebabToTitle(config.tokenName)} ${kebabToTitle(prop.property)}',`);
    lines.push(`  group: 'Typography Scale',`);
    lines.push(`},`);
  }
  lines.push('```');
  lines.push('');
  lines.push('4. Replace hardcoded values in components with the new token.');
  lines.push('');

  return lines.join('\n');
}

function kebabToTitle(s: string): string {
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
