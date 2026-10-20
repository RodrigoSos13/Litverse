import { test } from "node:test";
import assert from "node:assert/strict";
import { getUsers, setFollow } from "../src/controllers/userController.js";
import { User } from "../src/models/User.js";
import { Follow } from "../src/models/Follow.js";

const viewer = "507f1f77bcf86cd799439011";
const target = "507f1f77bcf86cd799439012";
const response = () => ({ status(code) { this.code = code; return this; }, json(body) { this.body = body; } });

test("seguimento valida perfil e impede seguir a própria conta", async () => {
  for (const [id, code] of [["inválido", 400], [viewer, 400]]) {
    const res = response();
    await setFollow({ params: { id }, user: { _id: viewer }, method: "PUT" }, res);
    assert.equal(res.code, code);
  }
});

test("seguir e deixar de seguir persistem relações e retornam contagens", async t => {
  let following = false;
  t.mock.method(User, "exists", async () => true);
  t.mock.method(Follow, "updateOne", async (filter, update, options) => {
    assert.deepEqual(filter, { seguidor: viewer, seguido: target });
    assert.equal(options.upsert, true);
    following = true;
  });
  t.mock.method(Follow, "deleteOne", async () => { following = false; });
  t.mock.method(Follow, "exists", async filter => filter.seguidor === viewer ? following : true);
  t.mock.method(Follow, "countDocuments", async filter => filter.seguido ? Number(following) : 0);
  for (const method of ["PUT", "PUT", "DELETE", "DELETE"]) {
    const res = response();
    await setFollow({ params: { id: target }, user: { _id: viewer }, method }, res);
    assert.deepEqual(res.body, { seguindo: method === "PUT", totalSeguidores: method === "PUT" ? 1 : 0, totalSeguindo: 0, segueVoce: true });
  }
});

test("busca escapa caracteres de regex e retorna estado de seguimento", async t => {
  t.mock.method(User, "find", filter => {
    assert.equal(filter.$or[0].nome.$regex, "a\\.\\*");
    assert.equal(filter._id.$ne, viewer);
    return { select() { return this; }, sort() { return this; }, limit() { return [{ _id: target, toObject: () => ({ _id: target, nome: "Leitor" }) }]; } };
  });
  t.mock.method(Follow, "find", filter => ({ lean: async () => filter.seguido === viewer ? [{ seguidor: target }] : [{ seguido: target }] }));
  const res = response();
  await getUsers({ query: { q: "@a.*" }, user: { _id: viewer } }, res);
  assert.equal(res.body[0].seguindo, true);
  assert.equal(res.body[0].segueVoce, true);
});
