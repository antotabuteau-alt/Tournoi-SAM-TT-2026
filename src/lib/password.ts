import { hash, verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, ARGON2_OPTIONS);
}

export function verifyPassword(
  passwordHash: string,
  plainPassword: string
): Promise<boolean> {
  return verify(passwordHash, plainPassword, ARGON2_OPTIONS);
}
