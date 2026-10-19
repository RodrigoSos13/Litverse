import { test } from "node:test";
import assert from "node:assert/strict";
import { encryptEmail, decryptEmail, emailHash, validateEmailKeys } from "../src/auth/emailPrivacy.js";
process.env.EMAIL_ENCRYPTION_KEY = "aa".repeat(32);
process.env.EMAIL_LOOKUP_KEY = "bb".repeat(32);
test("AES-GCM usa IV aleatório e rejeita adulteração, versão inválida e chave errada", () => {
  validateEmailKeys();
  const first = encryptEmail(" Person@Example.com ");
  assert.notEqual(first, encryptEmail("person@example.com"));
  assert.equal(decryptEmail(first), "person@example.com");
  const parts = first.split(":"); parts[2] = "00".repeat(16);
  assert.throws(() => decryptEmail(parts.join(":")));
  assert.throws(() => decryptEmail(first.replace("v1:", "v2:")));
  const original = process.env.EMAIL_ENCRYPTION_KEY;
  try { process.env.EMAIL_ENCRYPTION_KEY = "cc".repeat(32); assert.throws(() => decryptEmail(first)); }
  finally { process.env.EMAIL_ENCRYPTION_KEY = original; }
});
test("índice HMAC normaliza endereços e exige chaves válidas e independentes", () => {
  assert.equal(emailHash(" Person@Example.com "), emailHash("person@example.com"));
  assert.notEqual(emailHash("person@example.com"), emailHash("other@example.com"));
  const original = process.env.EMAIL_LOOKUP_KEY;
  try {
    process.env.EMAIL_LOOKUP_KEY = process.env.EMAIL_ENCRYPTION_KEY; assert.throws(validateEmailKeys);
    process.env.EMAIL_LOOKUP_KEY = "short"; assert.throws(validateEmailKeys); assert.throws(() => emailHash("person@example.com"));
  } finally { process.env.EMAIL_LOOKUP_KEY = original; }
});
