import mongoose from "mongoose";
import { createHash, randomBytes } from "node:crypto";
import { User } from "../models/User.js";
const schema = new mongoose.Schema({ token: { type: String, unique: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" }, expiresAt: { type: Date, expires: 0 } });
export const Session = mongoose.model("Session", schema);
const digest = token => createHash("sha256").update(token).digest("hex");
export function sessionToken(req) {
  return (req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith("litverse_session="))?.slice(17);
}
const options = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" };
export async function startSession(req, res, user) {
  const previous = sessionToken(req);
  if (previous) await Session.deleteOne({ token: digest(previous) });
  const token = randomBytes(32).toString("hex");
  const duration = 1000 * 60 * 60 * 24 * 7;
  await Session.create({ token: digest(token), user: user._id, expiresAt: new Date(Date.now() + duration) });
  res.cookie("litverse_session", token, { ...options, maxAge: duration });
}
export async function endSession(req, res) {
  const token = sessionToken(req);
  if (token) await Session.deleteOne({ token: digest(token) });
  res.clearCookie("litverse_session", options);
}
export async function requireAuth(req, res, next) {
  try {
    const token = sessionToken(req);
    const session = token && await Session.findOne({ token: digest(token), expiresAt: { $gt: new Date() } });
    const user = session && await User.findById(session.user);
    if (!user) return res.status(401).json({ message: "Entre na sua conta para continuar." });
    req.user = user;
    next();
  } catch { res.status(503).json({ message: "Não foi possível verificar sua sessão. Tente novamente." }); }
}
export function publicUser(user) {
  const result = user.toObject();
  delete result.passwordHash;
  delete result.email;
  return result;
}
