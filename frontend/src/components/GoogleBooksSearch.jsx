import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { catalogPageBooks } from "../services/bookCatalog";
import BookCard from "./BookCard";
import GoogleBooksAttribution from "./GoogleBooksAttribution";

export default function GoogleBooksSearch({ query = "", showSearchForm = false, localBooks = [], localQuery = "", localLoading = false, localError = "", onRetryLocal }) {
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [navigation, setNavigation] = useState({ term: "", cursors: [0] });
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState(null);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(null);
  const [retry, setRetry] = useState(0);
  const pageLock = useRef(false);
  const importLock = useRef(false);
  const navigate = useNavigate();
  const term = (showSearchForm ? submitted : query).trim();
  const requested = navigation.term === term ? navigation.cursors : [0];
  const cursor = requested[requested.length - 1];
  const visible = snapshot?.term === term ? snapshot : null;
  const result = visible?.result;
  const page = visible?.cursors.length || 1;
  const loading = !status || status.term !== term || status.cursor !== cursor || status.loading;
  const error = status?.term === term ? status.error : "";
  const books = catalogPageBooks({ query: term, localQuery, localBooks, externalQuery: visible?.term, externalBooks: result?.livros || [], page });

  useEffect(() => {
    const controller = new AbortController();
    const history = [...requested];
    setStatus({ term, cursor, loading: true, error: "" });
    setImportError("");
    if (term && term.length < 2) {
      setStatus({ term, cursor, loading: false, error: "Digite pelo menos 2 caracteres para buscar." });
      pageLock.current = false;
      return () => controller.abort();
    }
    const timer = setTimeout(async () => {
      try {
        const response = await api.get(term ? "/books/google/search" : "/books/google/discover", { params: term ? { q: term, startIndex: cursor } : {}, signal: controller.signal, timeout: 60000 });
        if (!controller.signal.aborted) {
          setSnapshot({ term, cursors: history, result: response.data });
          setStatus({ term, cursor, loading: false, error: "" });
        }
      } catch (err) {
        if (!controller.signal.aborted) setStatus({ term, cursor, loading: false, error: err.response?.data?.message || "Não foi possível carregar esta página. Tente novamente." });
      } finally { if (!controller.signal.aborted) pageLock.current = false; }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term, cursor, retry]);

  function requestPage(cursors) {
    if (loading || pageLock.current) return;
    pageLock.current = true;
    setNavigation({ term, cursors });
    setRetry(value => value + 1);
  }

  async function openBook(book) {
    if (importLock.current) return;
    importLock.current = true; setImporting(book.googleBooksId); setImportError("");
    try {
      const response = await api.post("/books/google/import", { googleBooksId: book.googleBooksId }, { timeout: 15000 });
      navigate(`/books/${response.data._id}`);
    } catch (err) { setImportError(err.response?.data?.message || "Não foi possível abrir este livro. Tente novamente."); }
    finally { importLock.current = false; setImporting(null); }
  }
  function submit(event) { event.preventDefault(); setSubmitted(draft.trim()); setNavigation({ term: draft.trim(), cursors: [0] }); setRetry(value => value + 1); }

  return (
    <section className="space-y-5" aria-label="Catálogo de livros">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-3xl text-white">{term ? "Resultados da busca" : "Explore os livros"}</h2><p className="mt-2 text-sm text-mist">{term ? "Edições em português para sua próxima leitura." : "Clássicos e histórias conhecidas, em edições em português."}</p></div><span className="text-sm text-mist">{books.length} livros</span></div>
      {showSearchForm && <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">Título, autor ou ISBN</span><input value={draft} onChange={event => setDraft(event.target.value)} minLength={2} maxLength={200} required placeholder="Busque por título, autor ou ISBN" className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-copper" /></label><button className="rounded-2xl bg-gradient-to-r from-forest to-berry px-6 py-3 font-semibold text-white">Buscar livros</button></form>}
      {importError && <p role="alert" className="rounded-xl border border-forest/40 bg-forest/10 p-4 text-sm text-glow">{importError}</p>}
      {localError && <p role="alert" className="text-sm text-mist">{localError} <button onClick={onRetryLocal} className="text-copper underline">Tentar novamente</button></p>}
      {error && <div role="alert" className="rounded-2xl border border-line bg-panelSoft p-4 text-sm text-mist"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} className="mt-2 font-semibold text-copper">Tentar novamente</button></div>}
      {(loading || localLoading) && <p role="status" className="text-sm text-mist">Carregando livros…</p>}
      {!loading && !localLoading && !error && !localError && books.length === 0 && <p className="rounded-2xl border border-dashed border-line p-5 text-mist">Nenhuma edição em português encontrada. Experimente outro título, autor ou ISBN.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{books.map(book => <BookCard key={book._id || book.googleBooksId} book={book} onOpen={openBook} opening={importing === book.googleBooksId} disabled={!!importing} />)}</div>
      {books.some(book => book.googleBooksId) && <div className="flex justify-end border-t border-line/60 pt-3"><GoogleBooksAttribution /></div>}
      {term && result && (page > 1 || result.hasMore) && <nav aria-label="Páginas da busca de livros" className="flex items-center justify-center gap-4"><button disabled={loading || page === 1} onClick={() => requestPage(visible.cursors.slice(0, -1))} className="rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-40">Anterior</button><span className="text-sm text-mist">Página {page}</span><button disabled={loading || !result.hasMore} onClick={() => requestPage([...visible.cursors, result.nextIndex])} className="rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-40">Próxima</button></nav>}
    </section>
  );
}
