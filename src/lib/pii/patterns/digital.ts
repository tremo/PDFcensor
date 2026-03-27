import type { PIIMatch } from "@/types/pii";

/**
 * Detect IPv4 addresses (e.g. 192.168.1.1)
 * Excludes common non-PII addresses: 0.x.x.x, 127.x.x.x, 255.x.x.x
 * Each octet must be 0–255.
 */
export function detectIPv4(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?<!\d)(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?!\d)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const octets = [match[1], match[2], match[3], match[4]].map(Number);
    if (octets.some((o) => o > 255)) continue;

    // Skip loopback (127.x), broadcast (255.x), unspecified (0.x)
    const first = octets[0];
    if (first === 0 || first === 127 || first === 255) continue;

    // Skip version-number-like patterns (e.g. 1.2.3.4 in "v1.2.3.4")
    const before = match.index > 0 ? text[match.index - 1] : "";
    if (before === "v" || before === "V") continue;

    matches.push({
      type: "ipAddress",
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
 * Detect IPv6 addresses.
 * Covers full form (8 groups of 4 hex), abbreviated (::), and mixed (::ffff:192.168.1.1).
 */
export function detectIPv6(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  // Full or abbreviated IPv6 — must have at least two colons to distinguish from MAC/other hex
  const regex =
    /(?<![:\w])([0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){7}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}|[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4})(?![:\w])/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Must contain at least 2 colons to be a credible IPv6
    if ((match[0].match(/:/g) || []).length < 2) continue;
    // Skip the all-zeros loopback (::1, ::)
    const cleaned = match[0].replace(/[:\s]/g, "");
    if (/^0*1?$/.test(cleaned)) continue;

    matches.push({
      type: "ipAddress",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.75,
    });
  }

  return matches;
}

/**
 * Detect IP addresses (v4 + v6).
 */
export function detectIPAddress(text: string, pageIndex: number): PIIMatch[] {
  return [...detectIPv4(text, pageIndex), ...detectIPv6(text, pageIndex)];
}

/**
 * Detect MAC addresses.
 * Formats: XX:XX:XX:XX:XX:XX, XX-XX-XX-XX-XX-XX, XXXX.XXXX.XXXX
 */
export function detectMACAddress(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex =
    /(?<![0-9a-fA-F:.-])([0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5}|[0-9a-fA-F]{2}(?:-[0-9a-fA-F]{2}){5}|[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4})(?![0-9a-fA-F:.-])/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Skip broadcast (FF:FF:FF:FF:FF:FF) and all-zeros
    const hex = match[1].replace(/[:\-.]/g, "").toUpperCase();
    if (/^0+$/.test(hex) || /^F+$/i.test(hex)) continue;

    matches.push({
      type: "macAddress",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.85,
    });
  }

  return matches;
}

/**
 * Detect cryptocurrency wallet addresses.
 * - Bitcoin (BTC): 1/3 + 25-34 base58, or bc1 + 39-59 bech32
 * - Ethereum (ETH): 0x + 40 hex chars
 */
export function detectCryptoWallet(
  text: string,
  pageIndex: number
): PIIMatch[] {
  const matches: PIIMatch[] = [];

  // Bitcoin legacy (1xxx or 3xxx) and SegWit (bc1xxx)
  const btcRegex =
    /(?<![a-zA-Z0-9])([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-HJ-NP-Z0-9]{39,59})(?![a-zA-Z0-9])/g;
  let match;
  while ((match = btcRegex.exec(text)) !== null) {
    matches.push({
      type: "cryptoWallet",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.85,
    });
  }

  // Ethereum (0x + 40 hex)
  const ethRegex = /(?<![a-zA-Z0-9])(0x[0-9a-fA-F]{40})(?![a-zA-Z0-9])/g;
  while ((match = ethRegex.exec(text)) !== null) {
    matches.push({
      type: "cryptoWallet",
      value: match[1],
      startIndex: match.index,
      endIndex: match.index + match[1].length,
      pageIndex,
      confidence: 0.9,
    });
  }

  return matches;
}
