/**
 * Seals and salts, byte for byte the contract's (contracts/samepage.py
 * seal_of). Plain JavaScript so the site, the Node scripts and the vector
 * check run this exact file.
 *
 *   seal = sha256(UTF-8 "text|salt|address"), the address in lower case with 0x
 *
 * tests/vectors.json holds the shared test vectors; scripts/check-vectors.mjs
 * checks this file against them and tests/test_static.py runs that check.
 */

/** Lower-case hex sha256 of a string's UTF-8 bytes, with SubtleCrypto (browser and Node alike). */
export async function sha256Hex(text) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function sealOf(text, salt, address) {
  return sha256Hex(`${text}|${salt}|${String(address).toLowerCase()}`);
}

/** A fresh salt: a random UUID, 36 letters, digits and dashes, inside the contract's 8 to 80. */
export function newSalt() {
  return globalThis.crypto.randomUUID();
}

/** Characters as the contract counts them: Python's len, one per code point. */
export function length(text) {
  return [...text].length;
}

/** Why a text cannot be an account the contract will open, or an empty string. */
export function accountProblem(text, max = 1200) {
  if (text.trim() === '') return 'Write the deal in your own words first.';
  if (length(text) > max) return `At most ${max.toLocaleString('en-US')} characters.`;
  return '';
}
