import { test } from "node:test";
import assert from "node:assert/strict";
import { validateUploadedImage } from "../src/services/uploadedImage.js";

test("aceita imagem PNG enviada e mantém links existentes", () => {
  assert.doesNotThrow(() => validateUploadedImage("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1sAAAAASUVORK5CYII="));
  assert.doesNotThrow(() => validateUploadedImage("https://example.com/art.png"));
});

test("rejeita conteúdo disfarçado, SVG e imagens acima de 5 MB", () => {
  assert.throws(() => validateUploadedImage("data:image/png;base64,aGVsbG8="));
  assert.throws(() => validateUploadedImage("data:image/svg+xml;base64,PHN2Zz4="));
  assert.throws(() => validateUploadedImage(`data:image/jpeg;base64,${Buffer.alloc(5 * 1024 * 1024 + 1).toString("base64")}`));
});
