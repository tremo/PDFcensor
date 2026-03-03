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
 * Detect Turkish phone numbers
 * Formats: +90 5XX XXX XX XX, 0 5XX XXX XX XX, etc.
 */
export function detectTRPhone(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?:\+90|0)\s?[5]\d{2}\s?\d{3}\s?\d{2}\s?\d{2}\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      type: "trPhone",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  return matches;
}

/**
 * Detect Turkish passport numbers (1 letter + 6 digits)
 */
export function detectTRPassport(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /\b([A-Z]\d{6})\b/g;
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
