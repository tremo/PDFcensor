import type { PIIMatch } from "@/types/pii";
import { validateTCKimlik } from "../validators/tc-kimlik";

/**
 * Detect Turkish TC Kimlik numbers
 */
export function detectTCKimlik(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  // Match 11-digit numbers that start with non-zero
  const regex = /\b([1-9]\d{10})\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const value = match[1];
    if (validateTCKimlik(value)) {
      matches.push({
        type: "tcKimlik",
        value,
        startIndex: match.index,
        endIndex: match.index + value.length,
        pageIndex,
        confidence: 0.95,
      });
    }
  }

  return matches;
}

/**
 * Detect passport numbers (1-2 letters + 6-9 digits)
 * Covers Turkish (1 letter + 7-8 digits), EU, and most international formats.
 */
export function detectTRPassport(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /\b([A-Z]{1,2}\d{6,9})\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      type: "passport",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.7,
    });
  }

  return matches;
}
