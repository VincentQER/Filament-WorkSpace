import { randomBytes } from "node:crypto";

export function newVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export function verificationExpiryIso(hours = 48): string {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}
