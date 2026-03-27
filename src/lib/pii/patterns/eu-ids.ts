import type { PIIMatch } from "@/types/pii";
import { validateLuhn } from "../validators/luhn";

/**
 * European national identity number detector.
 *
 * All country-specific IDs report as `nationalId` type.
 * Each sub-detector validates with the country's official checksum
 * algorithm where applicable, keeping false positives low.
 *
 * Covered:
 *  - UK: NHS Number (MOD 11), NINO (National Insurance)
 *  - DE: Personalausweis (10-char), Steuer-ID (11 digits, check digit)
 *  - FR: NIR / numéro de sécurité sociale (MOD 97)
 *  - ES: NIF/DNI (MOD 23 letter check)
 *  - IT: Codice Fiscale (16-char alphanumeric)
 *  - NL: BSN / Burgerservicenummer (11-proof)
 *  - PL: PESEL (Luhn variant with weighted sum)
 *  - SE: Personnummer (Luhn on 10 digits)
 *  - PT: NIF / Número de Identificação Fiscal (MOD 11)
 */
export function detectNationalId(
  text: string,
  pageIndex: number
): PIIMatch[] {
  const matches: PIIMatch[] = [];

  // Run all sub-detectors
  matches.push(
    ...detectUKNHS(text, pageIndex),
    ...detectUKNINO(text, pageIndex),
    ...detectDESteuerID(text, pageIndex),
    ...detectDEPerso(text, pageIndex),
    ...detectFRNIR(text, pageIndex),
    ...detectESNIF(text, pageIndex),
    ...detectITCodiceFiscale(text, pageIndex),
    ...detectNLBSN(text, pageIndex),
    ...detectPLPESEL(text, pageIndex),
    ...detectSEPersonnummer(text, pageIndex),
    ...detectPTNIF(text, pageIndex)
  );

  return matches;
}

// ─── UK NHS Number ──────────────────────────────────────────────────────────
// 10 digits, MOD 11 check digit (digit 10). Format: XXX XXX XXXX

function validateNHS(digits: string): boolean {
  if (digits.length !== 10) return false;
  const d = digits.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += d[i] * (10 - i);
  }
  const check = 11 - (sum % 11);
  if (check === 11) return d[9] === 0;
  if (check === 10) return false; // invalid
  return d[9] === check;
}

function detectUKNHS(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?<!\d)(\d{3})\s*(\d{3})\s*(\d{4})(?!\d)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const digits = match[1] + match[2] + match[3];
    if (!validateNHS(digits)) continue;

    // Require nearby keyword to reduce false positives
    const windowStart = Math.max(0, match.index - 60);
    const context = text.slice(windowStart, match.index + match[0].length + 20).toLowerCase();
    if (!/nhs|national\s*health|patient|health\s*(?:id|number|no)/i.test(context)) continue;

    matches.push({
      type: "nationalId",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  return matches;
}

// ─── UK NINO ────────────────────────────────────────────────────────────────
// Format: AB 12 34 56 C (2 letters, 6 digits, 1 letter)
// Prefix restrictions: D, F, I, Q, U, V not used; BG, GB, NK, KN, TN, NT, ZZ invalid

const NINO_INVALID_PREFIXES = new Set([
  "BG", "GB", "NK", "KN", "TN", "NT", "ZZ",
]);

function detectUKNINO(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex =
    /(?<![A-Z])([A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z])\s*(\d{2})\s*(\d{2})\s*(\d{2})\s*([A-D])(?![A-Z])/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const prefix = (match[1]).toUpperCase();
    if (NINO_INVALID_PREFIXES.has(prefix)) continue;

    matches.push({
      type: "nationalId",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.85,
    });
  }

  return matches;
}

// ─── DE Steuer-ID ───────────────────────────────────────────────────────────
// 11 digits, first digit != 0. Exactly one digit appears twice or three times,
// at least one digit does not appear at all. Check digit via weighted algorithm.

function validateDESteuerID(value: string): boolean {
  if (value.length !== 11) return false;
  const d = value.split("").map(Number);
  if (d[0] === 0) return false;

  // Check digit (last digit) — simplified ISO 7064 MOD 11,10
  let product = 10;
  for (let i = 0; i < 10; i++) {
    let sum = (d[i] + product) % 10;
    if (sum === 0) sum = 10;
    product = (sum * 2) % 11;
  }
  const check = (11 - product) % 10;
  return d[10] === check;
}

function detectDESteuerID(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?<!\d)([1-9]\d{10})(?!\d)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!validateDESteuerID(match[1])) continue;

    // Require keyword context to avoid collisions with other 11-digit numbers (e.g. TC Kimlik)
    const windowStart = Math.max(0, match.index - 80);
    const context = text.slice(windowStart, match.index + match[0].length + 30).toLowerCase();
    if (!/steuer|tax\s*id|identifikationsnummer|tin\b|finanzamt/i.test(context)) continue;

    matches.push({
      type: "nationalId",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  return matches;
}

// ─── DE Personalausweis ─────────────────────────────────────────────────────
// New format (2010+): 10 alphanumeric chars (L0-9, C, F, G, H, J, K), last digit is check.
// Pattern: [CFGHJKLMNPRTVWXYZ0-9]{9}[0-9]

function detectDEPerso(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?<![A-Z0-9])([CFGHJKLMNPRTVWXYZ0-9]{9}\d)(?![A-Z0-9])/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Must contain at least 1 letter and 1 digit
    if (!/[A-Z]/.test(match[1]) || !/\d/.test(match[1])) continue;

    const windowStart = Math.max(0, match.index - 60);
    const context = text.slice(windowStart, match.index + match[0].length + 30).toLowerCase();
    if (!/personalausweis|ausweis|identity\s*card|id[\s-]*(?:card|nummer|number)/i.test(context)) continue;

    matches.push({
      type: "nationalId",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.8,
    });
  }

  return matches;
}

// ─── FR NIR ─────────────────────────────────────────────────────────────────
// 15 digits (13 base + 2 check). Format: S SS MM DDD CCC NNN CC
// S: sex (1/2), SS: birth year, MM: month, DDD: department, CCC: commune, NNN: order, CC: check
// Check: 97 - (first 13 digits MOD 97)

function validateFRNIR(value: string): boolean {
  if (value.length !== 15) return false;
  // Sex must be 1 or 2
  if (value[0] !== "1" && value[0] !== "2") return false;

  const base = BigInt(value.slice(0, 13));
  const check = parseInt(value.slice(13), 10);
  return check === 97 - Number(base % BigInt(97));
}

function detectFRNIR(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?<!\d)([12]\s?\d{2}\s?\d{2}\s?\d{2,3}\s?\d{3}\s?\d{3}\s?\d{2})(?!\d)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const digits = match[1].replace(/\s/g, "");
    if (digits.length !== 15) continue;
    if (!validateFRNIR(digits)) continue;

    matches.push({
      type: "nationalId",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  return matches;
}

// ─── ES NIF/DNI ─────────────────────────────────────────────────────────────
// 8 digits + check letter. Letter = "TRWAGMYFPDXBNJZSQVHLCKE"[number % 23]
// NIE variant: X/Y/Z prefix replaces first digit (X=0, Y=1, Z=2)

const NIF_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

function validateESNIF(value: string): boolean {
  const upper = value.toUpperCase();
  let numStr: string;
  const lastChar = upper[upper.length - 1];

  if (/^[XYZ]/.test(upper)) {
    // NIE: replace prefix
    const prefix = upper[0] === "X" ? "0" : upper[0] === "Y" ? "1" : "2";
    numStr = prefix + upper.slice(1, -1);
  } else {
    numStr = upper.slice(0, -1);
  }

  if (!/^\d{8}$/.test(numStr)) return false;
  const num = parseInt(numStr, 10);
  return NIF_LETTERS[num % 23] === lastChar;
}

function detectESNIF(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  // DNI: 8 digits + letter, NIE: X/Y/Z + 7 digits + letter
  const regex = /(?<![A-Z0-9])([XYZ]?\d{7,8}[A-Z])(?![A-Z0-9])/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!validateESNIF(match[1])) continue;

    matches.push({
      type: "nationalId",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  return matches;
}

// ─── IT Codice Fiscale ──────────────────────────────────────────────────────
// 16 chars: AAABBB DDLDD LDDDL (letters+digits, specific pattern)
// Simplified: 6 letters + 2 digits + 1 letter + 2 digits + 1 letter + 3 digits + 1 letter

function detectITCodiceFiscale(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex =
    /(?<![A-Z0-9])([A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z])(?![A-Z0-9])/gi;
  let match;

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      type: "nationalId",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  return matches;
}

// ─── NL BSN ─────────────────────────────────────────────────────────────────
// 9 digits. "11-proof": 9*d1 + 8*d2 + 7*d3 + ... + 2*d8 - 1*d9 ≡ 0 (mod 11), result != 0

function validateBSN(value: string): boolean {
  if (value.length !== 9) return false;
  const d = value.split("").map(Number);
  const sum =
    9 * d[0] + 8 * d[1] + 7 * d[2] + 6 * d[3] + 5 * d[4] +
    4 * d[5] + 3 * d[6] + 2 * d[7] - 1 * d[8];
  return sum > 0 && sum % 11 === 0;
}

function detectNLBSN(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?<!\d)(\d{9})(?!\d)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!validateBSN(match[1])) continue;

    // Require keyword context to reduce false positives on 9-digit numbers
    const windowStart = Math.max(0, match.index - 60);
    const context = text.slice(windowStart, match.index + match[0].length + 30).toLowerCase();
    if (!/bsn|burgerservicenummer|sofi\s*nummer|citizen\s*service/i.test(context)) continue;

    matches.push({
      type: "nationalId",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  return matches;
}

// ─── PL PESEL ───────────────────────────────────────────────────────────────
// 11 digits. Weighted checksum: weights [1,3,7,9,1,3,7,9,1,3], sum mod 10, check = (10 - sum%10) % 10

function validatePESEL(value: string): boolean {
  if (value.length !== 11) return false;
  const d = value.split("").map(Number);
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += d[i] * weights[i];
  }
  const check = (10 - (sum % 10)) % 10;
  return d[10] === check;
}

function detectPLPESEL(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?<!\d)(\d{11})(?!\d)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!validatePESEL(match[1])) continue;

    // Basic birth date validation: month in positions 2-3
    const monthCode = parseInt(match[1].slice(2, 4), 10);
    // PESEL encodes century in month: 01-12 = 1900s, 21-32 = 2000s, 41-52 = 2100s, 61-72 = 2200s, 81-92 = 1800s
    const monthBase = monthCode % 20;
    if (monthBase < 1 || monthBase > 12) continue;

    matches.push({
      type: "nationalId",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  return matches;
}

// ─── SE Personnummer ────────────────────────────────────────────────────────
// Format: YYMMDD-XXXX or YYYYMMDD-XXXX. Last digit is Luhn check on 10-digit form.

function detectSEPersonnummer(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  // YYYYMMDD-XXXX or YYMMDD-XXXX
  const regex = /(?<!\d)(\d{6,8})[-+](\d{4})(?!\d)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const datePart = match[1].length === 8 ? match[1].slice(2) : match[1];
    const tenDigits = datePart + match[2];
    if (tenDigits.length !== 10) continue;

    // Validate Luhn on the 10 digits
    if (!validateLuhn(tenDigits, 10, 10)) continue;

    // Basic date validation
    const month = parseInt(datePart.slice(2, 4), 10);
    const day = parseInt(datePart.slice(4, 6), 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;

    matches.push({
      type: "nationalId",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.85,
    });
  }

  return matches;
}

// ─── PT NIF ─────────────────────────────────────────────────────────────────
// 9 digits. First digit: 1,2,3 (individual), 5 (legal), 6 (public), 7 (non-resident), 8 (enterprise), 9 (provisional).
// Check: 9*d1 + 8*d2 + ... + 2*d8 → check = 11 - (sum mod 11); if check >= 10 → 0.

function validatePTNIF(value: string): boolean {
  if (value.length !== 9) return false;
  const first = parseInt(value[0], 10);
  if (![1, 2, 3, 5, 6, 7, 8, 9].includes(first)) return false;

  const d = value.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += d[i] * (9 - i);
  }
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return d[8] === check;
}

function detectPTNIF(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?<!\d)([123456789]\d{8})(?!\d)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!validatePTNIF(match[1])) continue;

    // Require keyword context
    const windowStart = Math.max(0, match.index - 60);
    const context = text.slice(windowStart, match.index + match[0].length + 30).toLowerCase();
    if (!/nif|contribuinte|fiscal|tax/i.test(context)) continue;

    matches.push({
      type: "nationalId",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.85,
    });
  }

  return matches;
}
