import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

function key(name) {
  const value = process.env[name];
  if (!/^[a-fA-F0-9]{64}$/.test(value || "")) throw new Error(`${name} deve conter 32 bytes em hexadecimal.`);
  return Buffer.from(value, "hex");
}
export function validateEmailKeys() {
  const encryption = key("EMAIL_ENCRYPTION_KEY");
  const lookup = key("EMAIL_LOOKUP_KEY");
  if (encryption.equals(lookup)) throw new Error("As chaves de criptografia e busca devem ser diferentes.");
}
export const normalizeEmail = email => email.trim().toLowerCase();
export function emailHash(email) {
  return createHmac("sha256", key("EMAIL_LOOKUP_KEY")).update(`litverse:email:v1:${normalizeEmail(email)}`).digest("hex");
}
export function encryptEmail(email) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key("EMAIL_ENCRYPTION_KEY"), iv);
  cipher.setAAD(Buffer.from("litverse:email:v1"));
  const encrypted = Buffer.concat([cipher.update(normalizeEmail(email), "utf8"), cipher.final()]);
  return ["v1", iv.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
}
export function decryptEmail(value) {
  const [version, iv, tag, encrypted, extra] = String(value).split(":");
  if (version !== "v1" || extra !== undefined || !/^[a-f0-9]{24}$/.test(iv || "") || !/^[a-f0-9]{32}$/.test(tag || "") || !/^(?:[a-f0-9]{2})+$/.test(encrypted || "")) throw new Error("E-mail criptografado inválido.");
  const decipher = createDecipheriv("aes-256-gcm", key("EMAIL_ENCRYPTION_KEY"), Buffer.from(iv, "hex"));
  decipher.setAAD(Buffer.from("litverse:email:v1"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "hex")), decipher.final()]).toString("utf8");
}
export function protectedEmail(email) {
  return { emailEncrypted: encryptEmail(email), emailHash: emailHash(email) };
}
