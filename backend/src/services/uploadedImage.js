export function validateUploadedImage(value) {
  if (typeof value !== "string") throw new Error("Imagem inválida.");
  if (!value.startsWith("data:")) return;
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new Error("Envie uma imagem JPG, PNG ou WebP.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 5 * 1024 * 1024) throw new Error("A imagem deve ter até 5 MB.");
  const valid = {
    png: bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    jpeg: bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
    webp: bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP",
  };
  if (!valid[match[1]] || bytes.toString("base64") !== match[2]) throw new Error("O arquivo não corresponde ao formato da imagem.");
}
