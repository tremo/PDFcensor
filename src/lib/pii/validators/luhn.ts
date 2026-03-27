/**
 * Validates a number using the Luhn algorithm.
 * Default range 13-19 digits (credit cards). Pass minDigits/maxDigits to override.
 */
export function validateLuhn(
  value: string,
  minDigits = 13,
  maxDigits = 19
): boolean {
  const cleaned = value.replace(/[\s-]/g, "");
  if (cleaned.length < minDigits || cleaned.length > maxDigits || !/^\d+$/.test(cleaned))
    return false;

  let sum = 0;
  let alternate = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let n = parseInt(cleaned[i], 10);

    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }

    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}
