import "dotenv/config";
import cors from "cors";
import express from "express";
import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import readingRoutes from "./routes/readingRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";

import authRoutes from "./auth/routes.js";
import { requireAuth } from "./auth/session.js";
const app = express();
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use((req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.headers.origin && req.headers.origin !== frontendOrigin) return res.status(403).json({ message: "Origem não autorizada." });
  next();
});
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ message: "LitVerse API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api", requireAuth);
app.use("/api", (req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (req.path.startsWith("/users") && (req.method !== "PUT" || req.path !== `/users/${req.user._id}`)) return res.status(403).json({ message: "Você só pode editar sua própria conta." });
    if (req.method === "DELETE" && req.path.startsWith("/likes/") && req.path.split("/")[3] !== String(req.user._id)) return res.status(403).json({ message: "Você só pode remover suas próprias curtidas." });
    const resource = req.path.split("/")[1];
    const allowedFields = {
      posts: ["livro", "tipo", "texto", "urlImagem"],
      comments: ["publicacao", "texto"],
      likes: ["publicacao"],
      readings: ["livro", "status", "nota"],
      users: ["nome", "biografia", "urlAvatar"],
      books: ["titulo", "autor", "genero", "descricao", "urlCapa", "destaque", "totalPaginas", "editora", "anoPublicacao", "idioma", "isbn", "googleBooksId"],
    }[resource] || [];
    req.body = Object.fromEntries(allowedFields.filter(key => req.body?.[key] !== undefined).map(key => [key, req.body[key]]));
    req.body.usuario = req.user._id;
  }
  next();
});
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/readings", readingRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);

export default app;
