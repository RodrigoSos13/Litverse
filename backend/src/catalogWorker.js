import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { defaultCatalogQueries, syncCatalog } from "./services/catalogSync.js";

const once = process.argv.includes("--once");
const enabled = (process.env.CATALOG_SYNC_ENABLED || "true").trim().toLowerCase();
if (!["true", "false"].includes(enabled)) {
  console.error("CATALOG_SYNC_ENABLED deve ser true ou false.");
  process.exit(1);
}
if (!once && enabled === "false") {
  console.log("Sincronização automática desativada (CATALOG_SYNC_ENABLED=false). Importação manual continua disponível.");
  // Remain idle without connecting to MongoDB or Google; Docker must not restart-loop.
  await new Promise(resolve => {
    const keepAlive = setInterval(() => {}, 60 * 60 * 1000);
    const finish = () => { clearInterval(keepAlive); resolve(); };
    process.once("SIGTERM", finish);
    process.once("SIGINT", finish);
  });
  process.exit(0);
}
const args = process.argv.slice(2).filter(value => !value.startsWith("--"));
const configured = process.env.CATALOG_SYNC_QUERIES?.split("|").map(value => value.trim()).filter(Boolean);
const queries = args.length ? args : configured?.length ? configured : defaultCatalogQueries;
const pagesPerQuery = Number(process.env.CATALOG_SYNC_PAGES || 3);
const intervalHours = Number(process.env.CATALOG_SYNC_INTERVAL_HOURS || 12);
if (!Number.isInteger(pagesPerQuery) || pagesPerQuery < 1 || pagesPerQuery > 20 || !Number.isFinite(intervalHours) || intervalHours < 1 || queries.some(query => query.length < 2 || query.length > 200)) {
  console.error("Configuração inválida de sincronização do catálogo.");
  process.exit(1);
}
await connectDatabase();
let stopping = false;
let timer;
function stop() { stopping = true; if (timer) { clearTimeout(timer); timer = null; } }
process.on("SIGTERM", () => { stop(); mongoose.disconnect().finally(() => process.exit(0)); });
process.on("SIGINT", () => { stop(); mongoose.disconnect().finally(() => process.exit(0)); });
async function run() {
  if (!process.env.GOOGLE_BOOKS_API_KEY?.trim()) {
    console.log("Sincronização aguardando GOOGLE_BOOKS_API_KEY; catálogo local continua disponível.");
    if (once) process.exitCode = 1;
  } else {
    try { console.log("Sincronização concluída:", JSON.stringify(await syncCatalog({ queries, pagesPerQuery }))); }
    catch { console.error("Falha na sincronização; os livros já salvos foram preservados."); if (once) process.exitCode = 1; }
  }
  if (once) await mongoose.disconnect();
  else if (!stopping) timer = setTimeout(run, intervalHours * 60 * 60 * 1000);
}
await run();
