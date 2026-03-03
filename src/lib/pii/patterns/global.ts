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
 *
 * FIX: Uses (?!\p{L}) instead of trailing \b for keywords ending with
 * periods (sok., cad., mah., etc.). The old \b failed because after "."
 * followed by a space, both "." and " " are non-word chars → no boundary.
 *
 * Also snaps context boundaries to word edges to avoid cutting words
 * in half, which caused partial-word fragments in redaction highlights.
 */
export function detectAddress(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  // Use (?!\p{L}) as trailing boundary instead of \b,
  // so keywords ending with "." are matched correctly before spaces
  const keywords =
    /\b(?:sokak|sok\.|cadde|cad\.|mahalle|mah\.|bulvar|blv\.|street|st\.|avenue|ave\.|boulevard|blvd\.|road|rd\.|drive|dr\.|lane|ln\.|apt\.?|suite|ste\.?)(?!\p{L})/giu;
  let match;

  while ((match = keywords.exec(text)) !== null) {
    // Find line boundaries
    const lineStart = text.lastIndexOf("\n", match.index);
    const lineEnd = text.indexOf("\n", match.index);
    const actualLineStart = lineStart === -1 ? 0 : lineStart + 1;
    const actualLineEnd = lineEnd === -1 ? text.length : lineEnd;

    // Context window: up to 40 chars before and after keyword, within line
    let start = Math.max(actualLineStart, match.index - 40);
    let end = Math.min(actualLineEnd, match.index + match[0].length + 40);

    // Snap start forward to word boundary (don't cut words in half)
    if (start > actualLineStart && start < text.length && !/\s/.test(text[start])) {
      const spacePos = text.indexOf(" ", start);
      if (spacePos !== -1 && spacePos < match.index) {
        start = spacePos + 1;
      }
    }

    // Snap end backward to word boundary
    if (end < actualLineEnd && end > 0 && /\p{L}/u.test(text[end] || "")) {
      const spacePos = text.lastIndexOf(" ", end);
      if (spacePos > match.index + match[0].length) {
        end = spacePos;
      }
    }

    const addressText = text.slice(start, end).trim();

    if (addressText.length > 10) {
      matches.push({
        type: "address",
        value: addressText,
        startIndex: start,
        endIndex: end,
        pageIndex,
        confidence: 0.7,
      });
    }
  }

  return matches;
}
