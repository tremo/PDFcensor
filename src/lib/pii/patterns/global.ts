import type { PIIMatch } from "@/types/pii";
import { validateLuhn } from "../validators/luhn";
import { validateIBAN } from "../validators/iban";

/**
 * Detect email addresses
 */
export function detectEmail(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      type: "email",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.95,
    });
  }

  return matches;
}

/**
 * Detect IBAN numbers with MOD 97 validation
 */
export function detectIBAN(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /\b([A-Z]{2}\d{2}\s?[A-Z0-9]{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?[A-Z0-9]{0,4})\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (validateIBAN(match[1])) {
      matches.push({
        type: "iban",
        value: match[1],
        startIndex: match.index,
        endIndex: match.index + match[1].length,
        pageIndex,
        confidence: 0.95,
      });
    }
  }

  return matches;
}

/**
 * Detect credit card numbers with Luhn validation
 * Formats: XXXX XXXX XXXX XXXX, XXXX-XXXX-XXXX-XXXX
 */
export function detectCreditCard(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (validateLuhn(match[1])) {
      matches.push({
        type: "creditCard",
        value: match[1],
        startIndex: match.index,
        endIndex: match.index + match[1].length,
        pageIndex,
        confidence: 0.95,
      });
    }
  }

  return matches;
}

/**
 * Detect generic phone numbers (international format)
 */
export function detectPhone(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /\+\d{1,3}[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      type: "phone",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.8,
    });
  }

  return matches;
}

/**
 * Detect addresses (keyword-based)
 */
export function detectAddress(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  // Match lines containing address keywords
  const keywords =
    /\b(?:sokak|sok\.|cadde|cad\.|mahalle|mah\.|bulvar|blv\.|street|st\.|avenue|ave\.|boulevard|blvd\.|road|rd\.|drive|dr\.|lane|ln\.|apt\.?|suite|ste\.?)\b/gi;
  let match;

  while ((match = keywords.exec(text)) !== null) {
    // Grab surrounding context (up to 80 chars before and after the keyword)
    const start = Math.max(0, match.index - 40);
    const end = Math.min(text.length, match.index + match[0].length + 40);
    const lineStart = text.lastIndexOf("\n", match.index);
    const lineEnd = text.indexOf("\n", match.index);
    const actualStart = Math.max(start, lineStart + 1);
    const actualEnd = lineEnd === -1 ? end : Math.min(end, lineEnd);
    const addressText = text.slice(actualStart, actualEnd).trim();

    if (addressText.length > 10) {
      matches.push({
        type: "address",
        value: addressText,
        startIndex: actualStart,
        endIndex: actualEnd,
        pageIndex,
        confidence: 0.7,
      });
    }
  }

  return matches;
}
