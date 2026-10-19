import { emailHash } from "../src/auth/emailPrivacy.js";
import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import { Session } from "../src/auth/session.js";
import { hashPassword } from "../src/auth/password.js";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
async function main() {
  const terminal = createInterface({ input: stdin, output: stdout });
  let email, password;
  try {
    email = (await terminal.question("E-mail da conta existente: ")).trim().toLowerCase();
    password = await terminal.question("Nova senha (visível neste terminal): ");
  } finally { terminal.close(); }
  if (password.length < 8 || password.length > 128) throw new Error("A senha deve ter de 8 a 128 caracteres.");
  await connectDatabase();
  const user = await User.findOneAndUpdate({ emailHash: emailHash(email) }, { $set: { passwordHash: await hashPassword(password) }, $inc: { authVersion: 1 } });
  if (!user) throw new Error("Conta não encontrada.");
  await Session.deleteMany({ user: user._id });
  console.log("Senha definida. As sessões anteriores foram encerradas.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
