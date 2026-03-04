/**
 * Validates a Turkish TC Kimlik number using the official checksum algorithm.
 * TC Kimlik: 11 digits, first digit != 0
 * d10 = ((d1+d3+d5+d7+d9)*7 - (d2+d4+d6+d8)) mod 10
 * d11 = (d1+d2+d3+d4+d5+d6+d7+d8+d9+d10) mod 10
 */
export function validateTCKimlik(value: string): boolean {
  const cleaned = value.replace(/\s/g, "");
  if (!/^[1-9]\d{10}$/.test(cleaned)) return false;

  const digits = cleaned.split("").map(Number);

  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  const d10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  if (d10 !== digits[9]) return false;

  const d11Sum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const d11 = d11Sum % 10;
  if (d11 !== digits[10]) return false;

  return true;
}
