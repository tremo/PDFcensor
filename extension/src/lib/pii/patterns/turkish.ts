import type { PIIMatch } from "../types";
import { validateTCKimlik } from "../validators/tc-kimlik";

export function detectTCKimlik(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /\b([1-9]\d{10})\b/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (validateTCKimlik(match[1])) {
      matches.push({
        type: "tcKimlik",
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

export function detectTRPhone(text: string, pageIndex: number): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const regex = /(?<!\d)(?:\+90[\s.-]*|0[\s.-]?)\(?[2-5]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?!\d)/g;
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
