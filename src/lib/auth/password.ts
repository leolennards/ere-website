import { hash, verify } from "@node-rs/argon2";

// Argon2id (the library default) with OWASP-recommended parameters.
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export const MIN_PASSWORD_LENGTH = 12;

export function passwordProblems(pw: string): string[] {
  const problems: string[] = [];
  if (pw.length < MIN_PASSWORD_LENGTH) problems.push(`use at least ${MIN_PASSWORD_LENGTH} characters`);
  if (pw.length > 256) problems.push("use at most 256 characters");
  if (/^(.)\1+$/.test(pw)) problems.push("avoid repeating a single character");
  return problems;
}

export function hashPassword(pw: string) {
  return hash(pw, OPTIONS);
}

export async function verifyPassword(passwordHash: string, pw: string) {
  try {
    return await verify(passwordHash, pw);
  } catch {
    return false;
  }
}

// Verified against when an email is unknown, so login timing doesn't reveal
// which accounts exist.
let dummyHash: Promise<string> | undefined;
export function getDummyHash() {
  dummyHash ??= hashPassword("not-a-real-password-placeholder");
  return dummyHash;
}
