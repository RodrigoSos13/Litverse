import { Router } from "express";
import { User } from "../models/User.js";
import { hashPassword, verifyPassword } from "./password.js";
import { endSession, publicUser, requireAuth, startSession } from "./session.js";
const router = Router();
const attempts = new Map();
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (req.method !== "POST" || req.path === "/logout") return next();
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
  const entry = attempts.get(req.ip) || { count: 0, until: now + 15 * 60 * 1000 };
  entry.count++;
  attempts.set(req.ip, entry);
  if (entry.count > 20) return res.status(429).json({ message: "Muitas tentativas. Aguarde 15 minutos e tente novamente." });
  next();
});
router.post("/register", async (req, res) => {
  const { nome, usuario, email, senha } = req.body;
  if (typeof nome !== "string" || !nome.trim() || nome.length > 100 || typeof usuario !== "string" || !/^[a-zA-Z0-9_]{3,30}$/.test(usuario) || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof senha !== "string" || senha.length < 8 || senha.length > 128) return res.status(400).json({ message: "Informe nome, usuário válido, e-mail e uma senha de 8 a 128 caracteres." });
  try {
    const user = await User.create({ nome: nome.trim(), usuario, email, passwordHash: await hashPassword(senha) });
    await startSession(req, res, user);
    res.status(201).json(publicUser(user));
  } catch (error) { res.status(error.code === 11000 ? 409 : 503).json({ message: error.code === 11000 ? "E-mail ou nome de usuário já cadastrado." : "Não foi possível criar sua conta. Tente novamente." }); }
});
router.post("/login", async (req, res) => {
  const { identificador, senha } = req.body;
  if (typeof identificador !== "string" || identificador.length > 254 || typeof senha !== "string" || senha.length > 128) return res.status(400).json({ message: "Informe seu e-mail ou usuário e sua senha." });
  try {
    const identifier = identificador.trim().toLowerCase();
    const user = await User.findOne({ $or: [{ email: identifier }, { usuario: identifier }] }).select("+passwordHash");
    const valid = await verifyPassword(senha, user?.passwordHash);
    if (!user || !valid) return res.status(401).json({ message: "E-mail, usuário ou senha incorretos." });
    await startSession(req, res, user);
    res.json(publicUser(user));
  } catch { res.status(503).json({ message: "Não foi possível entrar agora. Tente novamente." }); }
});
router.get("/me", requireAuth, (req, res) => res.json(publicUser(req.user)));
router.post("/logout", async (req, res) => {
  try { await endSession(req, res); res.sendStatus(204); }
  catch { res.status(503).json({ message: "Não foi possível encerrar a sessão. Tente novamente." }); }
});
export default router;
