const portuguese = language => typeof language === "string" && ["pt", "pt-br", "pt-pt", "português", "portugues", "portuguese"].includes(language.trim().toLowerCase());
export function mergeCatalogBooks(localBooks, externalBooks) {
  const combined = [];
  const googleIds = new Set();
  const isbns = new Set();
  const localIds = new Set();
  for (const book of [...localBooks, ...externalBooks]) {
    if (!portuguese(book.idioma)) continue;
    const id = book._id || book.localId;
    const isbn = (book.isbn || "").replace(/[\s-]/g, "");
    if ((id && localIds.has(id)) || (book.googleBooksId && googleIds.has(book.googleBooksId)) || (isbn && isbns.has(isbn))) continue;
    if (id) localIds.add(id);
    if (book.googleBooksId) googleIds.add(book.googleBooksId);
    if (isbn) isbns.add(isbn);
    combined.push({ ...book, ...(id ? { _id: id } : {}) });
  }
  return combined;
}

export function catalogPageBooks({ query, localQuery, localBooks, externalQuery, externalBooks, page = 1 }) {
  return mergeCatalogBooks(page === 1 && localQuery === query ? localBooks : [], externalQuery === query ? externalBooks : []);
}
