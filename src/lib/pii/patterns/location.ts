import type { PIIMatch } from "@/types/pii";

/**
 * Detect GPS coordinates in various formats.
 *
 * Supported:
 *  - Decimal degrees: 41.0082, 28.9784 or 41.0082°N, 28.9784°E
 *  - DMS: 41°0'29.5"N 28°58'42.2"E
 *  - Signed decimal: 41.0082, 28.9784 (comma-separated pair)
 *
 * Latitude: -90 to 90, Longitude: -180 to 180
 */
export function detectGPSCoordinate(
  text: string,
  pageIndex: number
): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const seen = new Set<string>();

  // Decimal degree pairs: 41.0082, 28.9784 or 41.0082,28.9784
  // Also: -33.8688, 151.2093
  const decimalPairRegex =
    /(?<!\d)(-?\d{1,3}\.\d{3,8})\s*[,;]\s*(-?\d{1,3}\.\d{3,8})(?!\d)/g;
  let match;
  while ((match = decimalPairRegex.exec(text)) !== null) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    // Skip obviously non-coordinate values (both near zero)
    if (Math.abs(lat) < 1 && Math.abs(lon) < 1) continue;

    const key = `${match.index}:${match.index + match[0].length}`;
    if (seen.has(key)) continue;
    seen.add(key);

    matches.push({
      type: "gpsCoordinate",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.8,
    });
  }

  // Degrees with compass: 41.0082°N, 28.9784°E or 41.0082° N 28.9784° E
  const compassRegex =
    /(?<!\d)(\d{1,3}\.\d{2,8})\s*°?\s*([NS])\s*[,;]?\s*(\d{1,3}\.\d{2,8})\s*°?\s*([EW])(?!\w)/gi;
  while ((match = compassRegex.exec(text)) !== null) {
    const key = `${match.index}:${match.index + match[0].length}`;
    if (seen.has(key)) continue;
    seen.add(key);

    matches.push({
      type: "gpsCoordinate",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  // DMS: 41°0'29.5"N 28°58'42.2"E
  const dmsRegex =
    /(?<!\d)(\d{1,3})\s*°\s*(\d{1,2})\s*[''′]\s*(\d{1,2}(?:\.\d+)?)\s*[""″]?\s*([NS])\s*[,;]?\s*(\d{1,3})\s*°\s*(\d{1,2})\s*[''′]\s*(\d{1,2}(?:\.\d+)?)\s*[""″]?\s*([EW])(?!\w)/gi;
  while ((match = dmsRegex.exec(text)) !== null) {
    const key = `${match.index}:${match.index + match[0].length}`;
    if (seen.has(key)) continue;
    seen.add(key);

    matches.push({
      type: "gpsCoordinate",
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
 * Detect vehicle license plates for multiple countries.
 *
 * Each sub-pattern is anchored with negative lookbehind/ahead to avoid
 * matching substrings of longer identifiers.
 *
 * Countries covered:
 *  - TR: 34 ABC 1234, 06 A 1234
 *  - DE: B-AB 1234, M AB 123
 *  - FR: AA-123-AA
 *  - UK: AB12 CDE
 *  - IT: AA 123 AA
 *  - ES: 1234 ABC
 *  - NL: XX-99-XX, 99-XX-XX, etc.
 *  - PL: ABC 12345, AB 12345
 *  - SE: ABC 123
 *  - PT: AA-12-34, 12-34-AA, 12-AA-34
 *  - Generic EU: 1-3 letters, 1-4 digits, 0-3 letters
 */
export function detectLicensePlate(
  text: string,
  pageIndex: number
): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const seen = new Set<string>();

  const platePatterns: [RegExp, number][] = [
    // Turkey: 34 ABC 1234, 06 A 1234, 34 AB 123
    [/(?<![A-Z0-9])(\d{2})\s*([A-Z]{1,3})\s*(\d{2,4})(?![A-Z0-9])/g, 0.8],
    // Germany: B-AB 1234, M AB 123, HH-AB 123
    [/(?<![A-Z0-9])([A-ZÄÖÜ]{1,3})\s*-?\s*([A-Z]{1,2})\s+(\d{1,4})(?:\s*[HE])?(?![A-Z0-9])/g, 0.75],
    // France: AA-123-AA
    [/(?<![A-Z0-9])([A-Z]{2})-(\d{3})-([A-Z]{2})(?![A-Z0-9])/g, 0.9],
    // UK: AB12 CDE (2001+ format)
    [/(?<![A-Z0-9])([A-Z]{2}\d{2})\s*([A-Z]{3})(?![A-Z0-9])/g, 0.85],
    // Italy: AA 123 AA
    [/(?<![A-Z0-9])([A-Z]{2})\s*(\d{3})\s*([A-Z]{2})(?![A-Z0-9])/g, 0.8],
    // Spain: 1234 ABC
    [/(?<![A-Z0-9])(\d{4})\s*([A-HJKLMNPRSTVWXYZ]{3})(?![A-Z0-9])/g, 0.85],
    // Netherlands: sidecode formats XX-99-XX, 99-XX-XX, XX-XX-99, etc.
    [/(?<![A-Z0-9])([A-Z]{2})-(\d{2})-([A-Z]{2})(?![A-Z0-9])/g, 0.8],
    [/(?<![A-Z0-9])(\d{2})-([A-Z]{2})-(\d{2})(?![A-Z0-9])/g, 0.75],
    [/(?<![A-Z0-9])(\d{2})-([A-Z]{3})-(\d)(?![A-Z0-9])/g, 0.75],
    // Poland: ABC 12345 or AB 12345
    [/(?<![A-Z0-9])([A-Z]{2,3})\s+(\d{4,5})(?![A-Z0-9])/g, 0.7],
    // Sweden: ABC 123 (3 letters + space + 3 digits)
    [/(?<![A-Z0-9])([A-Z]{3})\s+(\d{3})(?![A-Z0-9])/g, 0.7],
    // Portugal: AA-12-34, 12-34-AA, 12-AA-34
    [/(?<![A-Z0-9])([A-Z]{2})-(\d{2})-(\d{2})(?![A-Z0-9])/g, 0.75],
    [/(?<![A-Z0-9])(\d{2})-(\d{2})-([A-Z]{2})(?![A-Z0-9])/g, 0.75],
    [/(?<![A-Z0-9])(\d{2})-([A-Z]{2})-(\d{2})(?![A-Z0-9])/g, 0.75],
  ];

  // Label keywords boost confidence
  const labelRegex =
    /(?:plate|plaka|plaque|targa|matrícula|nummernschild|kenteken|rejestracja|registreringsnummer|registreringsskylt|nummerplaat|rendszám)[\s.:]+/gi;
  const labelPositions = new Set<number>();
  let lm;
  while ((lm = labelRegex.exec(text)) !== null) {
    // Mark the 40-char window after label
    for (let i = lm.index; i < lm.index + lm[0].length + 40; i++) {
      labelPositions.add(i);
    }
  }

  for (const [pattern, baseConfidence] of platePatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const key = `${match.index}:${match.index + match[0].length}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const confidence = labelPositions.has(match.index)
        ? Math.min(baseConfidence + 0.15, 0.95)
        : baseConfidence;

      matches.push({
        type: "licensePlate",
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        pageIndex,
        confidence,
      });
    }
  }

  return matches;
}
