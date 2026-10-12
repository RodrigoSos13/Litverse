export const searchText = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function parseBookSearch(query) {
  const raw = String(query || "").trim();
  const field = /^(intitle|inauthor|isbn):\s*(.+)$/i.exec(raw);
  const term = field ? field[2] : raw;
  const compact = term.replace(/[\s-]/g, "");
  const isbn = field?.[1].toLowerCase() === "isbn" || /^(?:\d{9}[\dXx]|\d{13})$/.test(compact);
  return { field: isbn ? "isbn" : field?.[1].toLowerCase(), term, tokens: searchText(term).split(" ").filter(Boolean), compact };
}

export function matchesBookSearch(book, query) {
  const parsed = parseBookSearch(query);
  if (parsed.field === "isbn") return String(book.isbn || "").replace(/[\s-]/g, "").toLowerCase() === parsed.compact.toLowerCase();
  const text = searchText(parsed.field === "inauthor" ? book.autor : parsed.field === "intitle" ? book.titulo : `${book.titulo} ${book.autor}`);
  return parsed.tokens.length > 0 && parsed.tokens.every(token => text.includes(token));
}

function accentPattern(value) {
  const accents = { a: "[aáàâãä]", e: "[eéèêë]", i: "[iíìîï]", o: "[oóòôõö]", u: "[uúùûü]", c: "[cç]" };
  return [...value].map(character => accents[character] || character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("");
}

export function localBookSearchFilter(query) {
  const parsed = parseBookSearch(query);
  if (parsed.field === "isbn") return { isbn: { $regex: accentPattern(parsed.compact), $options: "i" } };
  if (!parsed.tokens.length) return { _id: null };
  const fields = parsed.field === "inauthor" ? ["autor"] : parsed.field === "intitle" ? ["titulo"] : ["titulo", "autor"];
  return { $and: parsed.tokens.map(token => ({ $or: fields.map(field => ({ [field]: { $regex: accentPattern(token), $options: "i" } })) })) };
}
