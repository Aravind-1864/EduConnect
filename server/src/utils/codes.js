import crypto from 'node:crypto';

// No look-alike characters (0/O, 1/I/L) so codes are easy to read aloud and type.
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALPHANUM = LETTERS + DIGITS;

const pick = (chars) => chars[crypto.randomInt(chars.length)];

export const CLASS_CODE_RE = /^\d{5}$/;
export const MEET_CODE_RE = /^[A-Z0-9]{6}$/;

/** 5-digit classroom join code, e.g. "48213" (never starts with 0). */
export const randomClassCode = () => String(crypto.randomInt(10000, 100000));

/** 6-character meet code mixing letters and digits, e.g. "K7P3QX". */
export function randomMeetCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () => pick(ALPHANUM)).join('');
  } while (!/[A-Z]/.test(code) || !/\d/.test(code));
  return code;
}

/** Generates codes until `exists(code)` is false. */
export async function uniqueCode(generate, exists) {
  for (let i = 0; i < 20; i += 1) {
    const code = generate();
    if (!(await exists(code))) return code;
  }
  throw new Error('Could not generate a unique code, please try again');
}

/** Normalises user input: classroom codes keep digits only, meet codes are upper-cased alphanumerics. */
export const cleanClassCode = (s) => String(s ?? '').replace(/\D/g, '');
export const cleanMeetCode = (s) => String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
