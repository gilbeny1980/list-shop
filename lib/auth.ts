import { createHash, randomBytes } from "crypto";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + "kniot-habayit-2024").digest("hex");
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}
