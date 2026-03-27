import type { PIIMatch } from "../types";

export function detectSSN(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /\b(\d{3})-(\d{2})-(\d{4})\b/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const area = parseInt(match[1], 10);
    if (area === 0 || area === 666 || area >= 900) continue;
    if (match[2] === "00" || match[3] === "0000") continue;
    matches.push({
      type: "ssn",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.95,
    });
  }
  return matches;
}

export function detectITIN(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /\b(9\d{2})-([7-9]\d)-(\d{4})\b/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({
      type: "itin",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.9,
    });
  }
  return matches;
}

export function detectUSPhone(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const cleaned = match[0].replace(/[\s.()+\-]/g, "");
    if (cleaned.length < 10 || cleaned.length > 11) continue;
    matches.push({
      type: "usPhone",
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      pageIndex,
      confidence: 0.8,
    });
  }
  return matches;
}
