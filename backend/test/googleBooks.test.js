import { test } from "node:test";
import assert from "node:assert/strict";
import { createGoogleBooksClient, normalizeVolume } from "../src/services/googleBooks.js";

const example = {
  id: "google_test_id",
  volumeInfo: {
    title: "Livro &amp; leitura", authors: ["Autora"], categories: ["Fiction"],
    description: "<p>Uma <b>história</b>.</p><script>bad()</script>",
    imageLinks: { thumbnail: "http://books.google.com/cover.jpg" },
    infoLink: "http://books.google.com/books?id=google_test_id",
    publisher: "Editora", publishedDate: "2024-10-01", pageCount: 250, language: "pt",
    industryIdentifiers: [{ type: "ISBN_10", identifier: "1234567890" }, { type: "ISBN_13", identifier: "9781234567890" }],
    averageRating: 5, ratingsCount: 100,
  },
};

test("normaliza metadados sem misturar avaliações externas com as do LitVerse", () => {
  const book = normalizeVolume(example);
  assert.equal(book.titulo, "Livro & leitura");
  assert.equal(book.isbn, "9781234567890");
  assert.equal(book.totalPaginas, 250);
  assert.equal(book.anoPublicacao, 2024);
  assert.match(book.urlCapa, /^https:/);
  assert.doesNotMatch(book.descricao, /<|script|bad/);
  assert.equal(book.mediaAvaliacoes, undefined);
  assert.equal(book.totalAvaliacoes, undefined);
});

test("lida com edições incompletas, capas inválidas e links não confiáveis", () => {
  const book = normalizeVolume({ id: "incomplete", volumeInfo: { title: "Livro", pageCount: 0, imageLinks: { thumbnail: "javascript:bad()" }, infoLink: "https://evil.example" } });
  assert.equal(book.autor, "Autor não informado");
  assert.equal(book.urlCapa, "");
  assert.equal(book.totalPaginas, undefined);
  assert.equal(book.googleBooksUrl, "https://books.google.com/books?id=incomplete");
  assert.equal(normalizeVolume({ id: "invalid", volumeInfo: {} }), null);
});

test("busca valida parâmetros, pagina e reutiliza consultas simultâneas", async () => {
  let calls = 0;
  const client = createGoogleBooksClient({ apiKey: () => "test-key", fetchImpl: async url => {
    calls++;
    assert.equal(url.origin, "https://www.googleapis.com");
    assert.equal(url.searchParams.get("q"), "leitura");
    assert.equal(url.searchParams.get("startIndex"), "12");
    assert.equal(url.searchParams.get("maxResults"), "40");
    assert.equal(url.searchParams.get("langRestrict"), "pt");
    return Response.json({ totalItems: 40, items: Array.from({ length: 13 }, (_, index) => ({ ...example, id: `volume_${index}`, volumeInfo: { ...example.volumeInfo, industryIdentifiers: [] } })) });
  } });
  const query = { query: "leitura", startIndex: 12 };
  const [first, second] = await Promise.all([client.search(query), client.search(query)]);
  assert.equal(calls, 1);
  assert.deepEqual(first, second);
  assert.equal(first.nextIndex, 24);
  assert.equal(first.hasMore, true);
  await client.search(query);
  assert.equal(calls, 1);
  await assert.rejects(client.search({ query: "a" }), error => error.status === 400);
  await assert.rejects(client.getVolume("../../evil"), error => error.status === 400);
});

test("falhas e falta de chave retornam mensagens públicas e não ficam no cache", async () => {
  const missing = createGoogleBooksClient({ apiKey: () => "" });
  await assert.rejects(missing.search({ query: "test" }), error => error.status === 503 && error.code === "GOOGLE_BOOKS_NOT_CONFIGURED");
  let calls = 0;
  const limited = createGoogleBooksClient({ apiKey: () => "private-test-key", fetchImpl: async () => { calls++; return Response.json({ error: "private-test-key" }, { status: 429 }); } });
  for (let attempt = 0; attempt < 2; attempt++) await assert.rejects(limited.search({ query: "test" }), error => error.status === 503 && !error.message.includes("private-test-key"));
  assert.equal(calls, 2);
  const malformed = createGoogleBooksClient({ apiKey: () => "test-key", fetchImpl: async () => new Response("bad JSON") });
  await assert.rejects(malformed.search({ query: "test" }), error => error.status === 502);
});

test("ISBN digitado com hífens usa a busca específica em português", async () => {
  const client = createGoogleBooksClient({ apiKey: () => "test-key", fetchImpl: async url => {
    assert.equal(url.searchParams.get("q"), "isbn:9781234567890");
    assert.equal(url.searchParams.get("langRestrict"), "pt");
    return Response.json({ totalItems: 1, items: [example] });
  } });
  assert.equal((await client.search({ query: "978-1-234-56789-0" })).livros[0].googleBooksId, example.id);
});

test("consulta cancela por timeout e permite resposta sem resultados", async () => {
  const timed = createGoogleBooksClient({ apiKey: () => "test-key", timeoutMs: 10, fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")))) });
  await assert.rejects(timed.search({ query: "test" }), error => error.status === 504);
  const empty = createGoogleBooksClient({ apiKey: () => "test-key", fetchImpl: async () => Response.json({ totalItems: 0 }) });
  const result = await empty.search({ query: "test" });
  assert.deepEqual(result.livros, []);
  assert.equal(result.hasMore, false);
});

test("repete falhas temporárias do Google sem repetir erros de credenciais", async () => {
  let calls = 0;
  const client = createGoogleBooksClient({ apiKey: () => "test-key", fetchImpl: async () => {
    calls++;
    return calls < 3 ? Response.json({ error: { errors: [{ reason: "backendFailed" }] } }, { status: 503 }) : Response.json({ totalItems: 1, items: [example] });
  } });
  const result = await client.search({ query: "leitura" });
  assert.equal(calls, 3);
  assert.equal(result.livros.length, 1);
  calls = 0;
  const forbidden = createGoogleBooksClient({ apiKey: () => "test-key", fetchImpl: async () => { calls++; return new Response(null, { status: 403 }); } });
  await assert.rejects(forbidden.search({ query: "romance" }), error => error.status === 503);
  assert.equal(calls, 1);
});


test("catálogo rejeita outros idiomas e descarta respostas que desrespeitam o filtro", async () => {
  const client = createGoogleBooksClient({ apiKey: () => "test-key", fetchImpl: async () => Response.json({ totalItems: 3, items: [example, { id: "english", volumeInfo: { title: "English edition", language: "en" } }, { id: "unknown", volumeInfo: { title: "Unknown language" } }] }) });
  const result = await client.search({ query: "leitura" });
  assert.deepEqual(result.livros.map(book => book.googleBooksId), [example.id]);
  await assert.rejects(client.search({ query: "test", language: "en" }), error => error.status === 400);
});

test("sugestões priorizam títulos conhecidos, descartam guias e toleram falhas parciais", async () => {
  const client = createGoogleBooksClient({ apiKey: () => "test-key", fetchImpl: async url => {
    const title = url.searchParams.get("q");
    if (title === "O Hobbit") return new Response(null, { status: 403 });
    return Response.json({ totalItems: 3, items: [
      { id: "guide_" + title.length, volumeInfo: { title: "Guia de leitura de " + title, language: "pt" } },
      { id: "known_" + title.length, volumeInfo: { title, language: "pt" } },
      { id: "english_" + title.length, volumeInfo: { title, language: "en" } },
    ] });
  } });
  const result = await client.discover();
  assert.equal(result.partial, true);
  assert.ok(result.livros.some(book => book.titulo === "Dom Casmurro"));
  assert.ok(result.livros.every(book => book.idioma === "pt" && !book.titulo.startsWith("Guia")));
  assert.equal(result.hasMore, false);
});

test("paginação preenche resultados relevantes em português e continua pelo cursor real", async () => {
  const volumes = Array.from({ length: 55 }, (_, index) => ({ id: `book_${index}`, volumeInfo: {
    title: index % 3 === 0 ? "Outro livro" : `Livro ${index}`,
    authors: [index % 3 === 0 ? "Outro autor" : "Brandon Sanderson"],
    language: index % 3 === 1 ? "en" : "pt",
  } }));
  const offsets = [];
  const client = createGoogleBooksClient({ apiKey: () => "test-key", fetchImpl: async url => {
    const offset = Number(url.searchParams.get("startIndex")); offsets.push(offset);
    return Response.json({ totalItems: 1, items: volumes.slice(offset, offset + 40) });
  } });
  const first = await client.search({ query: "Brandon Sanderson" });
  assert.equal(first.livros.length, 12);
  assert.equal(first.nextIndex, 38);
  assert.equal(first.hasMore, true);
  const second = await client.search({ query: "Brandon Sanderson", startIndex: first.nextIndex });
  assert.equal(second.livros.length, 6);
  assert.equal(second.hasMore, false);
  assert.deepEqual(offsets, [0, 38]);
  const combined = [...first.livros, ...second.livros];
  assert.equal(new Set(combined.map(book => book.googleBooksId)).size, 18);
  assert.ok(combined.every(book => book.idioma === "pt" && book.autor === "Brandon Sanderson"));
});

test("não encerra página incompleta após três lotes descartados", async () => {
  const volumes = Array.from({ length: 173 }, (_, index) => ({ id: `scattered_${index}`, volumeInfo: { title: `Livro ${index}`, authors: [index < 160 ? 'Outro autor' : 'Brandon Sanderson'], language: 'pt' } }));
  let calls = 0;
  const client = createGoogleBooksClient({ apiKey: () => 'test-key', fetchImpl: async url => {
    calls++;
    const offset = Number(url.searchParams.get('startIndex'));
    return Response.json({ totalItems: volumes.length, items: volumes.slice(offset, offset + 40) });
  } });
  const result = await client.search({ query: 'Brandon Sanderson' });
  assert.equal(calls, 5);
  assert.equal(result.livros.length, 12);
  assert.equal(result.nextIndex, 172);
  assert.equal(result.hasMore, true);
});
