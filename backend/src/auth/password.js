import { randomBytes, scrypt as derive, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(derive);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const [salt, encoded] = (stored || "").split(":");
  const actual = await scrypt(password, salt || "invalid-account", 64);
  const expected = Buffer.from(encoded || "", "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
