import crypto from "crypto";

export function generateQrToken(): string {
  return crypto.randomBytes(32).toString("hex");
}