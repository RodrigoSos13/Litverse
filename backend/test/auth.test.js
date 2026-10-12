import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mongoose from "mongoose";
import app from "../src/app.js";
import { Book } from "../src/models/Book.js";
import { User } from "../src/models/User.js";
import { Session } from "../src/auth/session.js";
import { hashPassword, verifyPassword } from "../src/auth/password.js";
let mongo, directory, server, base, cookie, otherUser, post;
const password = "Test-password-123";
async function request(path, { method = "GET", body, session = cookie, origin } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(session ? { Cookie: session } : {}), ...(origin ? { Origin: origin } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  return { status: response.status, data: text && JSON.parse(text), cookie: response.headers.get("set-cookie") };
}
before(async () => {
  directory = await mkdtemp(join(tmpdir(), "litverse-auth-test-"));
  mongo = spawn("mongod", ["--dbpath", directory, "--bind_ip", "127.0.0.1", "--port", "27941", "--nounixsocket"], { stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("MongoDB temporário não iniciou")), 15000);
    mongo.on("error", error => { clearTimeout(timer); reject(error); });
    mongo.on("exit", code => { clearTimeout(timer); reject(new Error(`mongod saiu: ${code}`)); });
    mongo.stdout.on("data", data => { if (data.toString().includes("Waiting for connections")) { clearTimeout(timer); resolve(); } });
  });
  await mongoose.connect("mongodb://127.0.0.1:27941/auth_test");
  await User.init(); await Session.init(); await Book.init();
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (mongo && mongo.exitCode === null) { const exited = new Promise(resolve => mongo.once("exit", resolve)); mongo.kill(); await exited; }
  if (directory) await rm(directory, { recursive: true, force: true });
});
test("senhas recebem salt e rejeitam credenciais incorretas", async () => {
  const first = await hashPassword(password);
  assert.notEqual(first, await hashPassword(password));
  assert.ok(await verifyPassword(password, first));
  assert.equal(await verifyPassword("wrong", first), false);
  assert.equal(await verifyPassword(password, undefined), false);
});
test("APIs bloqueiam visitantes e origens externas", async () => {
  assert.equal((await request("/posts", { session: null })).status, 401);
  assert.equal((await request("/auth/register", { method: "POST", origin: "https://other.example", body: {} })).status, 403);
});
test("cadastro valida dados, cria sessão segura e não expõe senha", async () => {
  assert.equal((await request("/auth/register", { method: "POST", body: { nome: "Test", usuario: "test", email: "test@example.com", senha: "short" } })).status, 400);
  const response = await request("/auth/register", { method: "POST", body: { nome: "Test", usuario: "test", email: "test@example.com", senha: password } });
  assert.equal(response.status, 201);
  assert.equal(response.data.passwordHash, undefined);
  assert.match(response.cookie, /HttpOnly/); assert.match(response.cookie, /SameSite=Lax/);
  cookie = response.cookie.split(";")[0];
  assert.equal((await request("/auth/me")).data.usuario, "test");
  assert.equal((await request("/auth/register", { method: "POST", body: { nome: "Test", usuario: "test", email: "test@example.com", senha: password } })).status, 409);
  const stored = await User.findOne({ usuario: "test" }).select("+passwordHash");
  assert.notEqual(stored.passwordHash, password);
  const session = await Session.findOne();
  assert.notEqual(session.token, cookie.split("=")[1]);
});
test("visitar perfil e forjar ID não permite agir como outro usuário", async () => {
  otherUser = await User.create({ nome: "Other", usuario: "other", email: "other@example.com", passwordHash: await hashPassword(password) });
  assert.equal((await request(`/users/${otherUser._id}/profile`)).status, 200);
  assert.equal((await request("/auth/me")).data.usuario, "test");
  const response = await request("/posts", { method: "POST", body: { usuario: otherUser._id, tipo: "opiniao", texto: "Hello" } });
  assert.equal(response.status, 201); assert.equal(response.data.usuario.usuario, "test"); post = response.data;
  assert.equal((await request(`/users/${otherUser._id}`, { method: "PUT", body: { nome: "Forged" } })).status, 403);
  assert.equal((await request(`/likes/${post._id}/${otherUser._id}`, { method: "DELETE" })).status, 403);
  assert.equal((await request("/users", { method: "POST", body: {} })).status, 403);
  const comment = await request("/comments", { method: "POST", body: { publicacao: post._id, usuario: otherUser._id, texto: "Comment" } });
  assert.equal(comment.data.usuario.usuario, "test");
  const like = await request("/likes", { method: "POST", body: { publicacao: post._id, usuario: otherUser._id } });
  assert.equal(like.data.usuario, post.usuario._id);
  const book = await Book.create({ titulo: "Test book", autor: "Author", genero: "Test", descricao: "Test description" });
  const reading = await request("/readings", { method: "POST", body: { usuario: otherUser._id, livro: book._id, status: "lendo", $set: { usuario: otherUser._id } } });
  assert.equal(reading.status, 201);
  assert.equal(reading.data.usuario.usuario, "test");
  const ownEdit = await request(`/users/${post.usuario._id}`, { method: "PUT", body: { nome: "Updated", email: "changed@example.com", passwordHash: "forged", usuario: "other" } });
  assert.equal(ownEdit.status, 200);
  assert.equal(ownEdit.data.usuario, "test");
  assert.equal(ownEdit.data.email, "test@example.com");
});
test("busca local aplica todos os termos antes de consultar e não retorna sugestões iniciais", async () => {
  const matching = await Book.create({ titulo: "O Caminho dos Reis", autor: "Brandon Sanderson", genero: "Fantasia", descricao: "Livro de teste", idioma: "pt" });
  await Book.create({ titulo: "Dom Casmurro", autor: "Machado de Assis", genero: "Romance", descricao: "Livro de teste", idioma: "pt" });
  const result = await request("/books?search=Brandon%20Sanderson");
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.map(book => book._id), [String(matching._id)]);
  assert.deepEqual((await request("/books?search=autor%20inexistente")).data, []);
  assert.deepEqual((await request("/books?search=%25%25")).data, []);
});
test("Google Books exige login e configuração, importa sem duplicar e preserva avaliações locais", async () => {
  assert.equal((await request("/books/google/search?q=test", { session: null })).status, 401);
  assert.equal((await request("/books/google/import", { method: "POST", session: null, body: { googleBooksId: "test_volume" } })).status, 401);
  const previousKey = process.env.GOOGLE_BOOKS_API_KEY;
  const originalFetch = globalThis.fetch;
  try {
    delete process.env.GOOGLE_BOOKS_API_KEY;
    const unavailable = await request("/books/google/search?q=configuration_test");
    assert.equal(unavailable.status, 503);
    assert.equal(unavailable.data.code, "GOOGLE_BOOKS_NOT_CONFIGURED");
    process.env.GOOGLE_BOOKS_API_KEY = "test-private-key";
    let upstreamCalls = 0;
    const volume = { id: "test_volume", volumeInfo: { title: "Imported title", authors: ["Imported author"], description: "<p>Imported description</p>", pageCount: 150, publishedDate: "2020", language: "pt", averageRating: 5 } };
    globalThis.fetch = (url, options) => {
      if (String(url).startsWith("https://www.googleapis.com/books/v1/volumes")) {
        upstreamCalls++;
        return Promise.resolve(Response.json(new URL(url).pathname.endsWith("/test_volume") ? volume : { totalItems: 1, items: [volume] }));
      }
      return originalFetch(url, options);
    };
    const search = await request("/books/google/search?q=Imported&language=pt");
    assert.equal(search.status, 200);
    assert.equal(search.data.livros[0].localId, null);
    assert.equal(JSON.stringify(search.data).includes("test-private-key"), false);
    assert.equal((await request("/books/google/search?q=x")).status, 400);
    assert.equal((await request("/books/google/import", { method: "POST", body: { googleBooksId: "../../invalid" } })).status, 400);
    const [first, second] = await Promise.all([
      request("/books/google/import", { method: "POST", body: { googleBooksId: "test_volume", titulo: "Forged title", mediaAvaliacoes: 5 } }),
      request("/books/google/import", { method: "POST", body: { googleBooksId: "test_volume" } }),
    ]);
    assert.ok([200, 201].includes(first.status));
    assert.ok([200, 201].includes(second.status));
    assert.equal(first.data._id, second.data._id);
    assert.equal(first.data.titulo, "Imported title");
    assert.equal(first.data.totalPaginas, 150);
    assert.equal(first.data.mediaAvaliacoes, 0);
    assert.equal(await Book.countDocuments({ googleBooksId: "test_volume" }), 1);
    assert.equal(upstreamCalls, 2);
    await Book.findByIdAndUpdate(first.data._id, { mediaAvaliacoes: 4, totalAvaliacoes: 1 });
    const again = await request("/books/google/import", { method: "POST", body: { googleBooksId: "test_volume" } });
    assert.equal(again.status, 200);
    assert.equal(again.data.mediaAvaliacoes, 4);
    assert.equal(upstreamCalls, 2);
    const saved = await request("/books/google/search?q=Imported&language=pt");
    assert.equal(saved.data.livros[0].localId, first.data._id);
    assert.equal((await request("/books/google/search?q=test&language=en")).status, 400);
    const english = await Book.create({ titulo: "English", autor: "Author", genero: "Test", descricao: "Test", idioma: "en", googleBooksId: "english_volume" });
    assert.equal((await request("/books/google/import", { method: "POST", body: { googleBooksId: "english_volume" } })).status, 400);
    assert.equal((await request("/books")).data.some(book => book._id === String(english._id)), false);
    assert.equal((await request("/books", { method: "POST", body: { titulo: "English manual", autor: "Author", genero: "Test", descricao: "Test", idioma: "en" } })).status, 400);
    const manual = await request("/books", { method: "POST", body: { titulo: "Manual title", autor: "Manual author", genero: "Test", descricao: "Manual description", totalPaginas: 200, editora: "Publisher", googleBooksId: "forged_volume" } });
    assert.equal(manual.status, 201);
    assert.equal(manual.data.googleBooksId, undefined);
    assert.equal(manual.data.totalPaginas, 200);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.GOOGLE_BOOKS_API_KEY;
    else process.env.GOOGLE_BOOKS_API_KEY = previousKey;
  }
});

test("logout revoga token; login valida senha e renova sessão", async () => {
  const previous = cookie;
  assert.equal((await request("/auth/logout", { method: "POST" })).status, 204);
  assert.equal((await request("/auth/me", { session: previous })).status, 401);
  assert.equal((await request("/auth/login", { method: "POST", body: { identificador: "test", senha: "wrong" } })).status, 401);
  const response = await request("/auth/login", { method: "POST", body: { identificador: "TEST@EXAMPLE.COM", senha: password } });
  assert.equal(response.status, 200); cookie = response.cookie.split(";")[0];
  const refreshed = await request("/auth/login", { method: "POST", body: { identificador: "test", senha: password } });
  assert.equal(refreshed.status, 200);
  assert.equal((await request("/auth/me")).status, 401);
  cookie = refreshed.cookie.split(";")[0];
  await Session.updateMany({}, { expiresAt: new Date(0) });
  assert.equal((await request("/auth/me")).status, 401);
});

test("limite de tentativas bloqueia abuso da autenticação", async () => {
  let response;
  for (let index = 0; index < 21; index++) response = await request("/auth/login", { method: "POST", body: {} });
  assert.equal(response.status, 429);
});
