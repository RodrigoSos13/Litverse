import { test } from "node:test";
import assert from "node:assert/strict";
import { getPosts } from "../src/controllers/postController.js";
import { Post } from "../src/models/Post.js";
import { Like } from "../src/models/Like.js";

test("busca publicações pelo texto literal e preserva os filtros", async t => {
  let captured;
  t.mock.method(Post, "find", filter => {
    captured = filter;
    return { populate() { return this; }, sort: async () => [] };
  });
  t.mock.method(Like, "find", () => ({ select() { return this; }, lean: async () => [] }));
  for (const q of ["  livro.*  ", ""]) {
    const res = { json(data) { this.data = data; }, status() { return this; } };
    await getPosts({ query: { q, user: "autor", book: "livro" }, user: { _id: "leitor" } }, res);
    assert.deepEqual(captured, { usuario: "autor", livro: "livro", ...(q ? { texto: { $regex: "livro\\.\\*", $options: "i" } } : {}) });
    assert.deepEqual(res.data, []);
  }
});
