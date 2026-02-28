export const TOKEN_GROUPS = [
  'Brand Colors',
  'Semantic Colors',
  'Surfaces',
  'Text Colors',
  'Borders',
  'Navigation',
  'Modular Type Scale',
  'Typography Scale',
  'Spacing & Layout',
  'Shadows',
] as const;

export type TokenGroup = (typeof TOKEN_GROUPS)[number];
