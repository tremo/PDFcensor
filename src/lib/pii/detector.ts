import type { PIIMatch, PIIType, PIIDetectionResult } from "@/types/pii";
import { detectTCKimlik, detectTRPhone, detectTRPassport } from "./patterns/turkish";
import { detectSSN, detectITIN, detectUSPhone } from "./patterns/us";
import {
  detectEmail,
  detectIBAN,
  detectCreditCard,
  detectPhone,
  detectAddress,
  detectDateOfBirth,
} from "./patterns/global";
import { detectNames } from "./patterns/names";
import { detectIPAddress, detectMACAddress, detectCryptoWallet } from "./patterns/digital";
import { detectGPSCoordinate, detectLicensePlate } from "./patterns/location";
import { detectNationalId } from "./patterns/eu-ids";

type DetectorFn = (text: string, pageIndex: number) => PIIMatch[];

const detectorMap: Record<PIIType, DetectorFn> = {
  tcKimlik: detectTCKimlik,
  trPhone: detectTRPhone,
  passport: detectTRPassport,
  ssn: detectSSN,
  itin: detectITIN,
  usPhone: detectUSPhone,
  email: detectEmail,
  iban: detectIBAN,
  creditCard: detectCreditCard,
  phone: detectPhone,
  address: detectAddress,
  names: detectNames,
  dateOfBirth: detectDateOfBirth,
  face: () => [], // Face detection is visual, not text-based
  ipAddress: detectIPAddress,
  macAddress: detectMACAddress,
  cryptoWallet: detectCryptoWallet,
  gpsCoordinate: detectGPSCoordinate,
  licensePlate: detectLicensePlate,
  nationalId: detectNationalId,
};

/**
 * Run PII detection for the given types on a text string.
 */
export function detectPII(
  text: string,
  pageIndex: number,
  piiTypes: PIIType[]
): PIIDetectionResult {
  const allMatches: PIIMatch[] = [];

  for (const piiType of piiTypes) {
    const detector = detectorMap[piiType];
    if (detector) {
      const matches = detector(text, pageIndex);
      allMatches.push(...matches);
    }
  }

  // Deduplicate overlapping matches (keep higher confidence)
  const deduplicated = deduplicateMatches(allMatches);

  // Count by type
  const byType: Record<string, number> = {};
  for (const m of deduplicated) {
    byType[m.type] = (byType[m.type] || 0) + 1;
  }

  return {
    matches: deduplicated,
    totalCount: deduplicated.length,
    byType,
  };
}

/**
 * Remove overlapping matches, keeping the one with higher confidence.
 */
function deduplicateMatches(matches: PIIMatch[]): PIIMatch[] {
  if (matches.length <= 1) return matches;

  // Sort by start index
  const sorted = [...matches].sort((a, b) => a.startIndex - b.startIndex);
  const result: PIIMatch[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = result[result.length - 1];
    const curr = sorted[i];

    // Check overlap
    if (curr.startIndex < prev.endIndex && curr.pageIndex === prev.pageIndex) {
      // Keep the one with higher confidence
      if (curr.confidence > prev.confidence) {
        result[result.length - 1] = curr;
      }
    } else {
      result.push(curr);
    }
  }

  return result;
}
