import { matchesBookSearch } from "./bookSearch.js";
const API_ROOT = "https://www.googleapis.com/books/v1/volumes";
const PAGE_SIZE = 12;
const validId = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export const isPortuguese = language => typeof language === "string" && ["pt", "pt-br", "pt-pt", "português", "portugues", "portuguese"].includes(language.trim().toLowerCase());
const FEATURED_TITLES = ["Dom Casmurro", "O Pequeno Príncipe", "O Hobbit", "Harry Potter e a Pedra Filosofal", "A Revolução dos Bichos", "Orgulho e Preconceito", "Memórias Póstumas de Brás Cubas", "O Alquimista", "Capitães da Areia"];
const titleKey = value => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export class GoogleBooksError extends Error {
  constructor(message, status = 502, code = "GOOGLE_BOOKS_UNAVAILABLE") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function plainText(value, maxLength = 20000) {
  if (typeof value !== "string") return "";
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(amp|quot|apos|lt|gt|nbsp);/g, (_, entity) => ({ amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " })[entity])
    .replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function httpsUrl(value, allowedHost) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return "";
    if (allowedHost && !allowedHost(url.hostname)) return "";
    url.protocol = "https:";
    return url.toString();
  } catch { return ""; }
}

export function normalizeVolume(volume) {
  const info = volume?.volumeInfo;
  if (!validId(volume?.id) || !info || !plainText(info.title)) return null;
  const identifiers = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers : [];
  const isbn = identifiers.find(item => item.type === "ISBN_13") || identifiers.find(item => item.type === "ISBN_10");
  const year = /^\d{4}/.exec(info.publishedDate || "");
  return {
    googleBooksId: volume.id,
    titulo: plainText(info.title, 500),
    autor: Array.isArray(info.authors) ? info.authors.map(author => plainText(author, 200)).filter(Boolean).join(", ") || "Autor não informado" : "Autor não informado",
    genero: Array.isArray(info.categories) ? plainText(info.categories[0], 200) || "Não informado" : "Não informado",
    descricao: plainText(info.description) || "Sinopse não disponível para esta edição.",
    urlCapa: httpsUrl(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail),
    editora: plainText(info.publisher, 300),
    idioma: plainText(info.language, 30),
    isbn: plainText(isbn?.identifier, 30),
    ...(Number.isInteger(info.pageCount) && info.pageCount > 0 ? { totalPaginas: info.pageCount } : {}),
    ...(year ? { anoPublicacao: Number(year[0]) } : {}),
    googleBooksUrl: httpsUrl(info.infoLink, host => ["books.google.com", "books.google.com.br"].includes(host)) || `https://books.google.com/books?id=${encodeURIComponent(volume.id)}`,
  };
}

export function createGoogleBooksClient({ fetchImpl = (...args) => fetch(...args), apiKey = () => process.env.GOOGLE_BOOKS_API_KEY, timeoutMs = 8000 } = {}) {
  const cache = new Map();
  const pending = new Map();

  async function request(path, params = {}) {
    const key = apiKey()?.trim();
    if (!key) throw new GoogleBooksError("A busca externa ainda não está disponível. Você pode consultar o catálogo ou cadastrar um livro manualmente.", 503, "GOOGLE_BOOKS_NOT_CONFIGURED");
    const url = new URL(API_ROOT + path);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, String(value));
    url.searchParams.set("key", key);
    const cacheKey = url.toString();
    const now = Date.now();
    for (const [id, entry] of cache) if (entry.expires <= now) cache.delete(id);
    if (cache.has(cacheKey)) return cache.get(cacheKey).data;
    if (pending.has(cacheKey)) return pending.get(cacheKey);

    const operation = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        let response;
        for (let attempt = 0; attempt < 3; attempt++) {
          response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: "application/json" } });
          if (![500, 502, 503, 504].includes(response.status) || attempt === 2) break;
          await response.body?.cancel();
          await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
          if (controller.signal.aborted) throw new Error("Timeout");
        }
        if (response.status === 404) throw new GoogleBooksError("Este livro não está mais disponível no Google Books.", 404, "GOOGLE_BOOKS_NOT_FOUND");
        if ([403, 429].includes(response.status)) throw new GoogleBooksError("O Google Books está indisponível ou atingiu o limite de consultas. Tente novamente mais tarde.", 503);
        if (!response.ok) throw new GoogleBooksError("O Google Books não conseguiu concluir esta busca. Tente outro título ou tente novamente em instantes.", 503);
        const data = await response.json();
        if (!data || typeof data !== "object" || Array.isArray(data) || data.error) throw new GoogleBooksError("O Google Books retornou uma resposta inválida.");
        if (cache.size >= 100) cache.delete(cache.keys().next().value);
        cache.set(cacheKey, { data, expires: Date.now() + 5 * 60 * 1000 });
        return data;
      } catch (error) {
        if (error instanceof GoogleBooksError) throw error;
        throw new GoogleBooksError(controller.signal.aborted ? "A consulta ao Google Books demorou demais. Tente novamente." : "Não foi possível conectar ao Google Books. Tente novamente.", controller.signal.aborted ? 504 : 502);
      } finally { clearTimeout(timer); }
    })();
    pending.set(cacheKey, operation);
    try { return await operation; }
    finally { pending.delete(cacheKey); }
  }

  return {
    async search({ query, startIndex = 0, language = "pt", maxBatches = 50 }) {
      if (typeof query !== "string" || query.trim().length < 2 || query.length > 200 || !Number.isInteger(startIndex) || startIndex < 0 || startIndex > 1000 || language !== "pt") throw new GoogleBooksError("Informe uma busca válida de 2 a 200 caracteres. O catálogo apresenta apenas edições em português.", 400, "INVALID_SEARCH");
      const term = query.trim();
      const isbn = term.replace(/[\s-]/g, "");
      const q = /^(?:\d{9}[\dXx]|\d{13})$/.test(isbn) ? `isbn:${isbn}` : term;
      const books = [];
      const ids = new Set();
      const isbns = new Set();
      let cursor = startIndex;
      let remaining = false;
      const deadline = Date.now() + 45000;
      for (let batch = 0; batch < maxBatches && cursor <= 1000 && Date.now() < deadline; batch++) {
        const data = await request("", { q, startIndex: cursor, maxResults: 40, printType: "books", langRestrict: "pt" });
        const items = Array.isArray(data.items) ? data.items : [];
        for (let index = 0; index < items.length && cursor + index <= 1000; index++) {
          const book = normalizeVolume(items[index]);
          if (!book || !isPortuguese(book.idioma) || !matchesBookSearch(book, term) || ids.has(book.googleBooksId) || (book.isbn && isbns.has(book.isbn))) continue;
          // O 13º resultado confirma a próxima página; seu cursor ainda não é consumido.
          if (books.length === PAGE_SIZE) return { livros: books, startIndex, nextIndex: cursor + index, hasMore: true };
          books.push(book); ids.add(book.googleBooksId);
          if (book.isbn) isbns.add(book.isbn);
        }
        cursor += items.length;
        remaining = items.length > 0 && cursor <= 1000 && (items.length === 40 || Number(data.totalItems) > cursor);
        if (!remaining) break;
      }
      return { livros: books, startIndex, nextIndex: cursor, hasMore: remaining };
    },
    async discover() {
      const results = await Promise.allSettled(FEATURED_TITLES.map(async title => {
        const result = await this.search({ query: title, maxBatches: 3 });
        const expected = titleKey(title);
        return result.livros.find(book => titleKey(book.titulo) === expected) || result.livros.find(book => titleKey(book.titulo).startsWith(expected + " "));
      }));
      const books = results.filter(result => result.status === "fulfilled" && result.value).map(result => result.value);
      const failed = results.filter(result => result.status === "rejected");
      if (!books.length && failed.length) throw failed[0].reason;
      return { livros: books.filter((book, index) => books.findIndex(item => item.googleBooksId === book.googleBooksId) === index), hasMore: false, startIndex: 0, nextIndex: 0, partial: failed.length > 0 };
    },
    async getVolume(id) {
      if (!validId(id)) throw new GoogleBooksError("Identificador de livro inválido.", 400, "INVALID_VOLUME");
      const volume = normalizeVolume(await request(`/${encodeURIComponent(id)}`));
      if (!volume || volume.googleBooksId !== id) throw new GoogleBooksError("O Google Books não retornou os dados desta edição.", 502);
      return volume;
    },
  };
}

export const googleBooks = createGoogleBooksClient();
