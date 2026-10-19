import { User } from "../models/User.js";
import { EmailCode } from "./emailCodes.js";
import { decryptEmail, emailHash, normalizeEmail, protectedEmail, validateEmailKeys } from "./emailPrivacy.js";

// Repeatable migration: each record changes atomically, preserving IDs and sessions.
// Validate existing ciphertext before changing anything, so wrong keys fail closed.
async function validateStoredEmails() {
  validateEmailKeys();
  for await (const user of User.collection.find({ emailEncrypted: { $exists: true } })) {
    const email = decryptEmail(user.emailEncrypted);
    if (user.emailHash !== emailHash(email)) throw new Error("Chaves de e-mail incompatíveis com o banco.");
    if (user.email && normalizeEmail(user.email) !== email) throw new Error("E-mail legado inconsistente.");
  }
  for await (const code of EmailCode.collection.find({ "payload.emailEncrypted": { $exists: true } })) {
    if (code.payload.emailHash !== emailHash(decryptEmail(code.payload.emailEncrypted))) throw new Error("Chaves incompatíveis com os códigos pendentes.");
  }
}

async function migrateEmails() {
  let users = 0, pending = 0;
  for await (const user of User.collection.find({ email: { $type: "string" } })) {
    const fields = protectedEmail(user.email);
    await User.collection.updateOne({ _id: user._id, email: user.email }, { $set: fields, $unset: { email: "" } });
    users++;
  }
  for await (const code of EmailCode.collection.find({ "payload.email": { $type: "string" } })) {
    await EmailCode.collection.updateOne({ _id: code._id, "payload.email": code.payload.email }, {
      $set: Object.fromEntries(Object.entries(protectedEmail(code.payload.email)).map(([key, value]) => [`payload.${key}`, value])),
      $unset: { "payload.email": "" },
    });
    pending++;
  }
  return { users, pending };
}

export async function prepareEmailStorage() {
  await validateStoredEmails();
  // New sparse index also protects users that have not been migrated yet.
  await User.collection.createIndex({ emailHash: 1 }, { unique: true, sparse: true });
  // Keep the old unique index until every user has its lookup index populated.
  for await (const user of User.collection.find({ email: { $type: "string" }, emailHash: { $exists: false } })) {
    await User.collection.updateOne({ _id: user._id, email: user.email }, { $set: protectedEmail(user.email) });
  }
  const indexes = await User.collection.indexes();
  for (const index of indexes) {
    if (Object.keys(index.key).length === 1 && index.key.email === 1) await User.collection.dropIndex(index.name);
  }
  return migrateEmails();
}
