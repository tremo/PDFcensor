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
  const regex = /\b([A-Z]{2}\d{2}\s?[A-Z0-9]{4}(?:\s?[A-Z0-9]{1,4}){2,7})\b/g;
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
 * Detect phone numbers across all countries and formats.
 *
 * Uses multiple regex patterns to cover international and local formats:
 *  1. International with + prefix: +CC XXXXXXXXX (various groupings)
 *  2. International dialing 00: 00CC XXXXXXXXX
 *  3. Parenthesized area code: (0XXX) XXX-XXXX
 *  4. Leading 0 + separator groups: 0XXX XXX XXXX
 *  5. Label-prefixed: Tel: XXXXXXXXX, Phone: XXXXXXXXX
 *
 * All matches are validated for 7–15 digit count and filtered against
 * date-like patterns to reduce false positives.
 */
export function detectPhone(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const seen = new Set<string>();

  const structuralPatterns: [RegExp, number][] = [
    // 1. International with + prefix (most reliable)
    //    +1 234 567 8901, +44 20 7946 0958, +90 532 123 45 67
    //    +33 1 23 45 67 89, +86-138-0013-8000, +49 (0)30 1234567
    [
      /\+\d{1,3}[\s.-]*\(?\d{1,5}\)?[\s.-]*\d{1,5}[\s.-]*\d{1,5}(?:[\s.-]*\d{1,5})?(?:[\s.-]*\d{1,5})?(?!\d)/g,
      0.9,
    ],
    // 2. International dialing prefix 00
    //    0044 20 7946 0958, 0090 532 123 45 67
    [
      /(?<!\d)00\d{2,3}[\s.-]*\(?\d{1,5}\)?[\s.-]*\d{1,5}[\s.-]*\d{1,5}(?:[\s.-]*\d{1,5})?(?!\d)/g,
      0.85,
    ],
    // 3. Parenthesized area code (common worldwide)
    //    (212) 555-1234, (0212) 555 12 34, (011) 98765-4321
    [
      /(?<!\d)\(0?\d{1,5}\)[\s.-]*\d{2,5}[\s.-]*\d{2,5}(?:[\s.-]*\d{1,5})?(?!\d)/g,
      0.85,
    ],
    // 4. Leading 0 + separated digit groups (Europe, Asia, Middle East, Africa)
    //    0212 444 1234, 0532-123-45-67, 020 7946 0958, 06 12 34 56 78
    [
      /(?<!\d)0\d{1,4}[\s.-]+\d{2,5}[\s.-]+\d{2,5}(?:[\s.-]+\d{1,5})?(?!\d)/g,
      0.8,
    ],
  ];

  for (const [pattern, confidence] of structuralPatterns) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
      addPhoneMatch(m[0], m.index, confidence);
    }
  }

  // 5. Label-prefixed phone numbers (contextual detection)
  //    Tel: 532 123 45 67, Phone: 555-123-4567, Fax: (212) 555-1234
  //    Telefon: 0532 123 45 67, GSM: 532 123 45 67, 電話: 03-1234-5678
  const labelRegex =
    /(?:tel(?:efon|[eé]phone|[eé]fono|efone)?|phone|fax|gsm|mobile|mobil|cep|cell(?:ular)?|h[üu]cre|telefax)[\s.:\/]+(\+?[\d][\d\s.()\-]{5,18}\d)/gi;
  labelRegex.lastIndex = 0;
  let lm;
  while ((lm = labelRegex.exec(text)) !== null) {
    const numPart = lm[1];
    const offset = lm[0].indexOf(numPart);
    addPhoneMatch(numPart, lm.index + offset, 0.85);
  }

  return matches;

  function addPhoneMatch(raw: string, index: number, confidence: number) {
    const value = raw.trim();
    const digits = value.replace(/\D/g, "");

    // Phone numbers have 7–15 digits
    if (digits.length < 7 || digits.length > 15) return;

    // Skip date-like patterns (YYYY-MM-DD, DD-MM-YYYY)
    if (isDateLike(value)) return;

    const start = index + (raw.length - raw.trimStart().length);
    const end = start + value.length;
    const key = `${start}:${end}`;
    if (seen.has(key)) return;
    seen.add(key);

    matches.push({
      type: "phone",
      value,
      startIndex: start,
      endIndex: end,
      pageIndex,
      confidence,
    });
  }
}

/** Check if string looks like a date rather than a phone number. */
function isDateLike(str: string): boolean {
  const s = str.trim();
  if (/^\d{4}[.\/-]\d{1,2}[.\/-]\d{1,2}$/.test(s)) return true;
  if (/^\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}$/.test(s)) return true;
  return false;
}

/**
 * Address keywords for all EU languages + Turkish + English.
 *
 * Full words: unambiguous address terms (sokak, street, straße, rue, etc.)
 * Abbreviations: shortened forms with periods (sok., str., ul., etc.)
 *
 * Built as arrays for maintainability, compiled to regex at module load.
 */
/** Keywords that appear as separate words — need leading (?<!\p{L}) */
const ADDRESS_STANDALONE = [
  // Turkish
  "sokak", "cadde", "mahalle", "bulvar",
  // English
  "street", "avenue", "boulevard", "road", "drive", "lane", "suite",
  // French
  "rue", "allée", "impasse", "chemin",
  // Spanish
  "calle", "avenida", "plaza", "paseo", "camino",
  // Italian
  "viale", "piazza", "vicolo",
  // Portuguese
  "rua", "praça", "travessa",
  // Dutch
  "straat", "laan", "gracht", "plein",
  // Polish
  "ulica", "aleja", "plac", "osiedle",
  // Czech/Slovak
  "náměstí", "třída", "námestie",
  // Hungarian
  "utca", "körút", "fasor",
  // Romanian
  "strada", "bulevardul", "piața", "aleea", "calea",
  // Croatian/Slovenian
  "avenija", "cesta",
  // Lithuanian
  "gatvė", "alėja", "aikštė",
  // Latvian
  "iela", "bulvāris", "laukums",
  // Irish
  "sráid", "bóthar",
  // Maltese
  "triq", "pjazza",
  // Greek
  "οδός", "λεωφόρος", "πλατεία",
  // Bulgarian
  "улица", "булевард", "площад",
];

/**
 * Keywords that appear as SUFFIXES in compound words.
 * These languages glue the street type to the street name:
 *   German: Friedrich+straße, Schloss+gasse, Alexander+platz
 *   Swedish: Kungs+gatan, Drottning+vägen, Stor+torget
 *   Danish: Kongens+gade, Nørre+stræde
 *   Finnish: Kalevan+katu, Hämeen+polku
 *   Estonian: Toom+tänav, Pärnu+puiestee
 * No leading boundary — they legitimately appear mid-word.
 */
const ADDRESS_SUFFIX = [
  // German
  "straße", "gasse", "platz", "allee",
  // Swedish
  "gatan", "vägen", "torget", "stigen",
  // Danish
  "gade", "plads", "stræde",
  // Finnish
  "katu", "polku", "kuja",
  // Estonian
  "tänav", "puiestee",
];

/** Abbreviation patterns (contain regex special chars like \.) */
const ADDRESS_ABBR_PATTERNS = [
  // Turkish
  "sok\\.", "cad\\.", "mah\\.", "blv\\.",
  // English
  "st\\.", "ave\\.", "blvd\\.", "rd\\.", "dr\\.", "ln\\.", "apt\\.?", "ste\\.?",
  // German
  "str\\.",
  // Spanish
  "avda\\.",
  // Polish
  "ul\\.", "al\\.", "os\\.",
  // Czech/Slovak
  "nám\\.",
  // Hungarian
  "krt\\.",
  // Romanian
  "bd\\.",
  // Bulgarian
  "ул\\.", "бул\\.", "пл\\.",
];

function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build the combined address keyword regex at module load time.
 *
 * Structure: (standalone_with_leading_boundary | suffix_without_leading) + trailing_boundary
 *   Standalone: (?<!\p{L})(?:sokak|rue|ulica|...)  — must be a separate word
 *   Suffix:     (?:straße|gatan|katu|...)           — can be end of compound word
 *   Abbr:       (?<!\p{L})(?:sok\.|str\.|ul\.|...)  — must be a separate word
 *   All share:  (?!\p{L}) trailing boundary
 */
const standalonePattern = ADDRESS_STANDALONE.map(escapeForRegex).join("|");
const suffixPattern = ADDRESS_SUFFIX.map(escapeForRegex).join("|");
const abbrPattern = ADDRESS_ABBR_PATTERNS.join("|");

const ADDRESS_REGEX = new RegExp(
  `(?:(?<!\\p{L})(?:${standalonePattern}|${abbrPattern})|(?:${suffixPattern}))(?!\\p{L})`,
  "giu"
);

/**
 * Detect addresses (keyword-based) across all EU languages.
 *
 * Supports two keyword modes:
 * - Standalone: "Rue de la Paix", "Kossuth utca 5" — keyword is a separate word
 * - Compound suffix: "Friedrichstraße 43", "Kungsgatan 44" — keyword is glued
 *   to the street name (German, Swedish, Danish, Finnish, Estonian)
 *
 * Uses (?<!\p{L}) / (?!\p{L}) Unicode-aware boundaries instead of \b:
 * - Leading \b failed for keywords starting with non-ASCII chars
 *   (e.g., Hungarian "körút", Greek "οδός", Czech "náměstí")
 * - Trailing \b failed after periods (sok., str., ul.)
 *
 * Snaps context boundaries to word edges to avoid cutting words in half.
 */
export function detectAddress(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  // Reset lastIndex since we reuse the module-level regex
  ADDRESS_REGEX.lastIndex = 0;
  let match;

  while ((match = ADDRESS_REGEX.exec(text)) !== null) {
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
