/**
 * Stylesheet scanner + prefix-indexed autocomplete dictionary.
 * Scans document.styleSheets to build a set of class selectors
 * for predictive class input in the Element Inspector.
 */

let cachedDictionary: ClassDictionary | null = null;

interface ClassDictionary {
  allClasses: string[];
  prefixIndex: Map<string, string[]>;
}

const EXCLUDED_PREFIXES = ['te-', '__next', '__N_'];

function isExcluded(cls: string): boolean {
  if (cls.length <= 1) return true;
  if (cls.includes('[')) return true; // arbitrary values
  for (const prefix of EXCLUDED_PREFIXES) {
    if (cls.startsWith(prefix)) return true;
  }
  return false;
}

function cleanSelector(selector: string): string {
  // Strip pseudo-classes/elements
  let cleaned = selector.replace(/:[\w-]+(\(.*?\))?/g, '');
  // Strip Tailwind escape sequences
  cleaned = cleaned.replace(/\\\//g, '/').replace(/\\:/g, ':').replace(/\\./g, '.');
  return cleaned;
}

function extractClassesFromRule(selectorText: string): string[] {
  const classes: string[] = [];
  // Find all .class-name patterns
  const classRegex = /\.([a-zA-Z0-9_-][\w\-/:.]*)/g;
  let match;

  const cleaned = cleanSelector(selectorText);

  while ((match = classRegex.exec(cleaned)) !== null) {
    const cls = match[1];
    if (!isExcluded(cls)) {
      classes.push(cls);
    }
  }

  return classes;
}

export function buildClassDictionary(): ClassDictionary {
  const classSet = new Set<string>();

  if (typeof document === 'undefined') {
    return { allClasses: [], prefixIndex: new Map() };
  }

  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const rules = sheet.cssRules || sheet.rules;
      if (!rules) continue;

      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        if (rule instanceof CSSStyleRule) {
          const extracted = extractClassesFromRule(rule.selectorText);
          for (const cls of extracted) {
            classSet.add(cls);
          }
        } else if (rule instanceof CSSMediaRule) {
          // Recurse into media queries
          for (let k = 0; k < rule.cssRules.length; k++) {
            const innerRule = rule.cssRules[k];
            if (innerRule instanceof CSSStyleRule) {
              const extracted = extractClassesFromRule(innerRule.selectorText);
              for (const cls of extracted) {
                classSet.add(cls);
              }
            }
          }
        }
      }
    } catch {
      // CORS — skip cross-origin stylesheets
      continue;
    }
  }

  const allClasses = Array.from(classSet).sort();

  // Build prefix index (first 2 chars)
  const prefixIndex = new Map<string, string[]>();
  for (const cls of allClasses) {
    if (cls.length < 2) continue;
    const prefix = cls.slice(0, 2).toLowerCase();
    const existing = prefixIndex.get(prefix);
    if (existing) {
      existing.push(cls);
    } else {
      prefixIndex.set(prefix, [cls]);
    }
  }

  return { allClasses, prefixIndex };
}

export function getClassDictionary(): ClassDictionary {
  if (!cachedDictionary) {
    cachedDictionary = buildClassDictionary();
  }
  return cachedDictionary;
}

/** Force rebuild (e.g. after dynamic style injection) */
export function invalidateClassDictionary(): void {
  cachedDictionary = null;
}

export function filterSuggestions(
  dict: ClassDictionary,
  input: string,
  max = 30
): string[] {
  const query = input.trim().toLowerCase();
  if (query.length < 2) return [];

  const prefix = query.slice(0, 2);
  const candidates = dict.prefixIndex.get(prefix) || [];

  // Prefix matches first, then contains matches from full set
  const prefixMatches: string[] = [];
  const containsMatches: string[] = [];

  // Check prefix-indexed candidates for prefix match
  for (const cls of candidates) {
    if (cls.toLowerCase().startsWith(query)) {
      prefixMatches.push(cls);
    }
  }

  // If we need more, scan all classes for contains match
  if (prefixMatches.length < max) {
    const remaining = max - prefixMatches.length;
    const prefixSet = new Set(prefixMatches);

    for (const cls of dict.allClasses) {
      if (prefixSet.has(cls)) continue;
      if (cls.toLowerCase().includes(query)) {
        containsMatches.push(cls);
        if (containsMatches.length >= remaining) break;
      }
    }
  }

  return [...prefixMatches.slice(0, max), ...containsMatches].slice(0, max);
}
