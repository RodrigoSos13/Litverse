import "dotenv/config";
import mongoose from "mongoose";
import { Book } from "../src/models/Book.js";
import { googleBooks } from "../src/services/googleBooks.js";
let updated = 0;
let failures = 0;
let skipped = 0;
const refreshAll = process.argv.includes("--all");
try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/litverse", { serverSelectionTimeoutMS: 5000 });
  const query = { googleBooksId: { $type: "string", $ne: "" }, ...(!refreshAll ? { $or: [{ descricaoFormatada: { $exists: false } }, { descricaoFormatada: "" }] } : {}) };
  console.log(`Livros sem vínculo com Google Books: ${await Book.countDocuments({ $or: [{ googleBooksId: { $exists: false } }, { googleBooksId: null }, { googleBooksId: "" }] })}`);
  console.log(`Sinopses pendentes: ${await Book.countDocuments(query)}`);
  for await (const book of Book.find(query).select("googleBooksId").lean().cursor()) {
    try {
      const volume = await googleBooks.getVolume(book.googleBooksId);
      if (volume.descricaoFormatada) {
        await Book.updateOne({ _id: book._id }, { $set: { descricao: volume.descricao, descricaoFormatada: volume.descricaoFormatada } });
        updated++;
        if (updated % 25 === 0) console.log(`Sinopses atualizadas: ${updated}`);
      } else { skipped++; }
    } catch (error) {
      failures++;
      process.exitCode = 1;
      console.log(`Sinopse indisponível (${error.code || "REFRESH_FAILED"}).`);
      if (["GOOGLE_BOOKS_NOT_CONFIGURED", "GOOGLE_BOOKS_UNAVAILABLE"].includes(error.code)) break;
    }
  }
  console.log(`Concluído: ${updated} atualizadas; ${skipped} sem sinopse na fonte; ${failures} falhas.`);
} catch {
  console.error("Não foi possível atualizar as sinopses. Verifique a conexão com o banco.");
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
