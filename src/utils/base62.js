// Character set: 0-9, a-z, A-Z (62 characters total)
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BASE = BigInt(ALPHABET.length); // 62n

/**
 * Encode a numeric ID (number | string | bigint) into a Base62 string
 * Safe for PostgreSQL BIGSERIAL (uses BigInt)
 */
export function encode(id) {
  let num = BigInt(id);

  // Edge case: 0
  if (num === 0n) return ALPHABET[0];

  let shortCode = "";

  while (num > 0n) {
    const remainder = num % BASE;
    shortCode = ALPHABET[Number(remainder)] + shortCode;
    num = num / BASE;
  }

  return shortCode;
}

/**
 * (Optional) Decode Base62 string back to numeric ID
 * Not required for your app, but useful for debugging / interviews
 */
export function decode(str) {
  let result = 0n;

  for (let i = 0; i < str.length; i++) {
    const value = BigInt(ALPHABET.indexOf(str[i]));
    result = result * BASE + value;
  }

  return result;
}