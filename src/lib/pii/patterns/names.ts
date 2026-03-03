import type { PIIMatch } from "@/types/pii";

let nameDictionary: Set<string> | null = null;

/**
 * Load name dictionary from a JSON file.
 * The JSON should be an array of strings.
 */
export async function loadNameDictionary(locale: string): Promise<void> {
  try {
    const response = await fetch(`/dictionaries/names-${locale}.json`);
    if (response.ok) {
      const names: string[] = await response.json();
      nameDictionary = new Set(names.map((n) => n.toLowerCase()));
    }
  } catch {
    // Dictionary not available for this locale
    nameDictionary = new Set();
  }
}

/**
 * Get the current dictionary for inline (sync) usage after loading.
 */
export function getNameDictionary(): Set<string> {
  return nameDictionary || new Set();
}

/**
 * Detect person names using dictionary lookup.
 * Looks for capitalized words that match the name dictionary.
 * Groups consecutive name-matches into full names.
 */
export function detectNames(text: string, pageIndex: number): PIIMatch[] {
  const dict = getNameDictionary();
  if (dict.size === 0) return [];

  const matches: PIIMatch[] = [];
  // Match sequences of capitalized words
  const regex = /\b([A-ZÇĞİÖŞÜÂÎÛÊ][a-zçğıöşüâîûê]+(?:\s+[A-ZÇĞİÖŞÜÂÎÛÊ][a-zçğıöşüâîûê]+)*)\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const words = match[1].split(/\s+/);
    // Check if at least one word is in the dictionary
    const hasNameMatch = words.some((w) => dict.has(w.toLowerCase()));

    if (hasNameMatch && words.length >= 2) {
      matches.push({
        type: "names",
        value: match[1],
        startIndex: match.index,
        endIndex: match.index + match[1].length,
        pageIndex,
        confidence: 0.75,
      });
    }
  }

  return matches;
}
