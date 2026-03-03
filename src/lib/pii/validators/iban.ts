/**
 * Validates an IBAN using the MOD 97 algorithm (ISO 13616).
 */
export function validateIBAN(value: string): boolean {
  const cleaned = value.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(cleaned)) return false;

  // Move first 4 chars to end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  const numericStr = rearranged
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : ch;
    })
    .join("");

  // MOD 97 on large number (process in chunks)
  let remainder = 0;
  for (let i = 0; i < numericStr.length; i++) {
    remainder = (remainder * 10 + parseInt(numericStr[i], 10)) % 97;
  }

  return remainder === 1;
}
