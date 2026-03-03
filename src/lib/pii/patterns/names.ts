import type { PIIMatch } from "@/types/pii";

let nameDictionary: Set<string> | null = null;
let loadedLocales: string[] = [];

/**
 * Load name dictionary from a JSON file (single locale).
 * Kept for backwards compatibility.
 */
export async function loadNameDictionary(locale: string): Promise<void> {
  return loadNameDictionaries([locale]);
}

/**
 * Load and merge name dictionaries from multiple locales.
 * For GDPR, this loads all EU language dictionaries so names from
 * any EU member state language can be detected in a single scan.
 */
export async function loadNameDictionaries(locales: string[]): Promise<void> {
  // Skip reload if same locales are already loaded
  const sortedNew = [...locales].sort().join(",");
  const sortedOld = [...loadedLocales].sort().join(",");
  if (sortedNew === sortedOld && nameDictionary && nameDictionary.size > 0) {
    return;
  }

  const allNames: string[] = [];

  const results = await Promise.allSettled(
    locales.map(async (locale) => {
      try {
        const response = await fetch(`/dictionaries/names-${locale}.json`);
        if (response.ok) {
          const names: string[] = await response.json();
          return names;
        }
      } catch {
        // Dictionary not available for this locale
      }
      return [];
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allNames.push(...result.value);
    }
  }

  nameDictionary = new Set(allNames.map((n) => n.toLowerCase()));
  loadedLocales = locales;
}

/**
 * Get the current dictionary for inline (sync) usage after loading.
 */
export function getNameDictionary(): Set<string> {
  return nameDictionary || new Set();
}

/**
 * Turkish-aware lowercase conversion.
 * JavaScript's toLowerCase() doesn't handle Turkish İ/I correctly:
 *   - İ (U+0130) should become 'i', but JS may produce 'i' + combining dot
 *   - I should become 'ı' in Turkish, but JS produces 'i'
 */
function turkishToLower(str: string): string {
  let result = "";
  for (const ch of str) {
    if (ch === "\u0130") result += "i"; // İ → i
    else if (ch === "I") result += "\u0131"; // I → ı
    else result += ch.toLowerCase();
  }
  return result;
}

/**
 * Check if a word exists in the dictionary, trying both standard
 * and Turkish-aware lowercase conversions.
 */
function isInDictionary(word: string, dict: Set<string>): boolean {
  return dict.has(word.toLowerCase()) || dict.has(turkishToLower(word));
}

/**
 * Detect person names using dictionary lookup.
 *
 * KEY FIX: Uses Unicode-aware word boundaries (?<!\p{L}) / (?!\p{L})
 * instead of \b, which only recognizes ASCII [a-zA-Z0-9_] as word
 * characters. The old \b approach failed for names starting with
 * Turkish characters like Ö, Ş, Ç, İ, Ğ, Ü — e.g., "Ömer" after a
 * space was never detected because \b saw space(\W) → Ö(\W) as
 * non-word→non-word and didn't trigger a boundary.
 *
 * Also adds detection for ALL CAPS names (e.g., "ÖMER MERT EKŞİOĞLU")
 * which are common in legal documents.
 */
export function detectNames(text: string, pageIndex: number): PIIMatch[] {
  const dict = getNameDictionary();
  if (dict.size === 0) return [];

  const matches: PIIMatch[] = [];

  // --- Title Case names (e.g., "Ömer Mert Ekşioğlu") ---
  // (?<!\p{L}) = not preceded by a letter (Unicode-aware start boundary)
  // [\p{Lu}]   = any Unicode uppercase letter (includes Ö, Ş, Ç, İ, Ğ, Ü)
  // [\p{Ll}]+  = one or more Unicode lowercase letters
  // (?!\p{L})  = not followed by a letter (Unicode-aware end boundary)
  const titleCaseRegex =
    /(?<!\p{L})([\p{Lu}][\p{Ll}]+(?:\s+[\p{Lu}][\p{Ll}]+)*)(?!\p{L})/gu;
  let match;

  while ((match = titleCaseRegex.exec(text)) !== null) {
    const fullMatch = match[1];
    const words = fullMatch.split(/\s+/);

    // Require at least 2 words, each at least 2 chars
    if (words.length < 2 || words.some((w) => w.length < 2)) continue;

    const hasNameMatch = words.some((w) => isInDictionary(w, dict));

    if (hasNameMatch) {
      matches.push({
        type: "names",
        value: fullMatch,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        pageIndex,
        confidence: 0.75,
      });
    }
  }

  // --- ALL CAPS names (e.g., "ÖMER MERT EKŞİOĞLU") ---
  // Common in legal/official documents
  const allCapsRegex =
    /(?<!\p{L})([\p{Lu}]{2,}(?:\s+[\p{Lu}]{2,})*)(?!\p{L})/gu;

  while ((match = allCapsRegex.exec(text)) !== null) {
    const fullMatch = match[1];
    const words = fullMatch.split(/\s+/);

    if (words.length < 2) continue;

    const hasNameMatch = words.some((w) => isInDictionary(w, dict));

    if (hasNameMatch) {
      matches.push({
        type: "names",
        value: fullMatch,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        pageIndex,
        confidence: 0.7,
      });
    }
  }

  return matches;
}
