import { test } from "node:test";
import assert from "node:assert/strict";
import { createPost } from "../src/controllers/postController.js";

async function rejectImages(imagens) {
  const response = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await createPost({ body: { tipo: "opiniao", texto: "Teste", imagens } }, response);
  assert.equal(response.code, 400);
  return response.body.message;
}

test("posts rejeitam listas inválidas e mais de quatro fotos", async () => {
  assert.match(await rejectImages("foto.png"), /4 fotos/);
  assert.match(await rejectImages(Array(5).fill("foto.png")), /4 fotos/);
});

test("posts exigem arquivos válidos para cada foto", async () => {
  assert.match(await rejectImages(["https://example.com/foto.png"]), /arquivo/);
  assert.match(await rejectImages(["data:image/png;base64,aGVsbG8="]), /formato/);
});

test("posts rejeitam fotos com tamanho total acima de 10 MB", async () => {
  const bytes = Buffer.alloc(4 * 1024 * 1024);
  bytes.set([255, 216, 255]);
  const image = `data:image/jpeg;base64,${bytes.toString("base64")}`;
  assert.match(await rejectImages([image, image, image]), /10 MB/);
});
