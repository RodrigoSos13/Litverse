import { searchText } from "./bookSearch.js";
import { isPortuguese } from "./googleBooks.js";

export function catalogFields(book) {
  const titleTokens = [...new Set(searchText(book.titulo).split(" ").filter(Boolean))];
  const authorTokens = [...new Set(searchText(book.autor).split(" ").filter(Boolean))];
  return {
    titleTokens,
    authorTokens,
    searchTokens: [...new Set([...titleTokens, ...authorTokens])],
    isbnSearch: String(book.isbn || "").replace(/[\s-]/g, "").toLowerCase(),
    catalogLanguageRank: isPortuguese(book.idioma) ? 0 : 1,
    catalogHasCover: typeof book.urlCapa === "string" && Boolean(book.urlCapa.trim()),
    catalogVersion: 1,
  };
}
