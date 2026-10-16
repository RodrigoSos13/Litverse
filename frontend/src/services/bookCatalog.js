const portuguese = language => typeof language === "string" && ["pt", "pt-br", "pt-pt", "português", "portugues", "portuguese"].includes(language.trim().toLowerCase());
export function mergeCatalogBooks(localBooks, externalBooks) {
  const combined = [];
  const googleIds = new Set();
  const isbns = new Set();
  const localIds = new Set();
  for (const book of [...localBooks, ...externalBooks]) {
    if (!portuguese(book.idioma) && !/^(?:en(?:-[a-z]{2})?|english|inglês|ingles)$/i.test(book.idioma || "")) continue;
    const id = book._id || book.localId;
    const isbn = (book.isbn || "").replace(/[\s-]/g, "");
    if ((id && localIds.has(id)) || (book.googleBooksId && googleIds.has(book.googleBooksId)) || (isbn && isbns.has(isbn))) continue;
    if (id) localIds.add(id);
    if (book.googleBooksId) googleIds.add(book.googleBooksId);
    if (isbn) isbns.add(isbn);
    combined.push({ ...book, ...(id ? { _id: id } : {}) });
  }
  return combined.sort((a, b) => Number(portuguese(b.idioma)) - Number(portuguese(a.idioma)));
}

const hasCover = book => typeof book.urlCapa === "string" && Boolean(book.urlCapa.trim());
const preference = (a, b) => Number(portuguese(b.idioma)) - Number(portuguese(a.idioma)) || Number(hasCover(b)) - Number(hasCover(a));
const identity = book => book._id || book.localId || book.googleBooksId || book.isbn;

export function catalogPageBooks({ query, localQuery, localBooks, externalQuery, externalBooks, orderedBooks, page = 1, offset = (page - 1) * 15, end = offset + 15 }) {
  const merged = mergeCatalogBooks(localQuery === query ? localBooks : [], externalQuery === query ? externalBooks : []);
  if (!orderedBooks) return merged.sort(preference).slice(offset, end);
  // O catálogo local chega em uma requisição independente. Uma lista externa
  // vazia ou já ordenada não pode esconder os livros locais recebidos depois.
  const remaining = new Set(merged);
  const ordered = [];
  for (const book of orderedBooks) {
    const current = merged.find(item => identity(item) === identity(book)
      || (book.googleBooksId && item.googleBooksId === book.googleBooksId)
      || (book.isbn && item.isbn === book.isbn));
    if (current && remaining.delete(current)) ordered.push(current);
  }
  return [...ordered, ...[...remaining].sort(preference)].slice(offset, end);
}

// Preserve as páginas vistas e procure capas nos lotes seguintes antes de
// completar a próxima página com livros sem capa. A busca tem orçamento limitado.
export async function loadCatalogPage({ previousResult, localBooks = [], offset = 0, fetchBatch, maxRequests = 6, budgetMs = 20000, onProgress }) {
  if (previousResult?.preparedOffset >= offset && previousResult.orderedBooks?.length > offset) return previousResult;
  let result = previousResult;
  let accumulated = result?.livros || [];
  const prefix = (previousResult?.orderedBooks || []).slice(0, offset);
  const seen = new Set(prefix.map(identity));
  function ordered() {
    return [...prefix, ...mergeCatalogBooks(localBooks, accumulated).filter(book => !seen.has(identity(book))).sort(preference)];
  }
  const deadline = Date.now() + budgetMs;
  for (let request = 0; request < maxRequests && Date.now() < deadline; request++) {
    const page = ordered().slice(offset, offset + 15);
    if (result && (!result.hasMore || (page.length === 15 && page.every(hasCover)))) break;
    const startIndex = result?.nextIndex ?? 0;
    let batch;
    try {
      batch = await fetchBatch(startIndex);
    } catch (error) {
      if (!page.length) throw error;
      break;
    }
    if (!Number.isInteger(batch.nextIndex) || batch.nextIndex < startIndex || (batch.hasMore && batch.nextIndex === startIndex)) {
      throw new Error("A busca não avançou. Tente novamente.");
    }
    accumulated = mergeCatalogBooks(accumulated, batch.livros || []);
    result = { ...batch, livros: accumulated };
    onProgress?.({ ...result, orderedBooks: ordered() });
  }
  return result ? { ...result, orderedBooks: ordered(), preparedOffset: offset } : result;
}
