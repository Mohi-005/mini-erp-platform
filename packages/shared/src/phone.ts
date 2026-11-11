import { normalizeDigits } from './index.ts';

/**
 * Normalizes a Bangladesh mobile number into canonical local representation (01XXXXXXXXX).
 * Returns null if the input is not a recognized Bangladesh mobile number.
 *
 * Supported formats:
 * - Local 11-digit format: 01XXXXXXXXX (e.g., 01712345678)
 * - International formats: +8801XXXXXXXXX, 8801XXXXXXXXX, 008801XXXXXXXXX
 * - Formatted variants with spaces, hyphens, parentheses:
 *     01712-345678, 01712 345678, (+880) 1712-345678
 * - Bengali numerals: ০১৭১২৩৪৫৬৭৮
 *
 * Requirements:
 * - Preserves exact comparison: does not match partial substrings.
 * - Does not match unrelated phone numbers merely because their last few digits are the same.
 * - Normalization is for comparison/search, not for silently overwriting master records.
 */
export function normalizeBdMobile(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Convert Bengali numerals to ASCII digits
  const ascii = normalizeDigits(trimmed);

  // 2. Remove standard formatting characters: spaces, hyphens, parentheses, plus, dots
  const stripped = ascii.replace(/[\s\-()+.,]/g, '');

  // If any non-digit character remains, it is invalid
  if (!/^\d+$/.test(stripped)) return null;

  // 3. Handle international country-code variants
  let localDigits = stripped;
  if (localDigits.startsWith('0088001')) {
    localDigits = localDigits.slice(5);
  } else if (localDigits.startsWith('008801')) {
    localDigits = '0' + localDigits.slice(5);
  } else if (localDigits.startsWith('88001')) {
    localDigits = localDigits.slice(3);
  } else if (localDigits.startsWith('8801')) {
    localDigits = '0' + localDigits.slice(3);
  } else if (localDigits.length === 10 && /^1[3-9]\d{8}$/.test(localDigits)) {
    localDigits = '0' + localDigits;
  }

  // 4. Validate canonical format: 11 digits starting with 01 and valid BD mobile operator [3-9]
  // In Bangladesh: 013, 014, 015, 016, 017, 018, 019
  if (/^01[3-9]\d{8}$/.test(localDigits)) {
    return localDigits;
  }

  return null;
}

/**
 * Checks whether an input string represents a valid Bangladesh mobile number.
 */
export function isBdMobile(input?: string | null): boolean {
  return normalizeBdMobile(input) !== null;
}

/**
 * Compares two phone strings for canonical equality under Bangladesh mobile normalization.
 * Returns true if both normalize to the exact same canonical local number.
 */
export function areBdMobilesEqual(
  a?: string | null,
  b?: string | null,
): boolean {
  const normA = normalizeBdMobile(a);
  const normB = normalizeBdMobile(b);
  if (!normA || !normB) return false;
  return normA === normB;
}
