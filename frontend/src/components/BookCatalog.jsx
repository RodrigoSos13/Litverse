import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import BookCard from "./BookCard";

export default function BookCatalog({ query = "", showSearchForm = false }) {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(() => params.get("search") || "");
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState(null);
  const [retry, setRetry] = useState(0);
  const sectionRef = useRef(null);
  const term = (showSearchForm ? params.get("search") || "" : query).trim();
  const searchEnabled = !showSearchForm || Boolean(term);
  const pageParam = Number(params.get("page") || 1);
  const requestedPage = Number.isSafeInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const visible = searchEnabled && snapshot?.term === term ? snapshot : null;
  const books = visible?.livros || [];
  const page = visible?.page || 1;
  const loading = searchEnabled && (!status || status.term !== term || status.page !== requestedPage || status.loading);
  const error = searchEnabled && status?.term === term ? status.error : "";

  useEffect(() => {
    if (showSearchForm) setDraft(term);
  }, [showSearchForm, term]);

  useEffect(() => {
    if (!searchEnabled) return;
    const controller = new AbortController();
    setStatus({ term, page: requestedPage, loading: true, error: "" });
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/books/catalog", {
          params: { ...(term ? { search: term } : {}), page: requestedPage },
          signal: controller.signal,
          timeout: 10000,
        });
        if (controller.signal.aborted) return;
        // Uma remoção durante a navegação não deve abrir uma página vazia.
        if (requestedPage > 1 && !data.livros.length && visible) {
          setSnapshot({ ...visible, hasMore: false });
        } else {
          setSnapshot({ ...data, term });
          if (visible && visible.page !== data.page) requestAnimationFrame(() => {
            if (!controller.signal.aborted) sectionRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
          });
        }
        setStatus({ term, page: requestedPage, loading: false, error: "" });
      } catch (err) {
        if (!controller.signal.aborted) setStatus({ term, page: requestedPage, loading: false, error: err.response?.data?.message || "Não foi possível carregar os livros. Tente novamente." });
      }
    }, requestedPage === 1 ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term, requestedPage, retry, searchEnabled]);

  function requestPage(nextPage) {
    if (loading) return;
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (nextPage > 1) next.set("page", String(nextPage));
      else next.delete("page");
      return next;
    });
  }
  function submit(event) {
    event.preventDefault();
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (draft.trim()) next.set("search", draft.trim());
      else next.delete("search");
      next.delete("page");
      return next;
    });
    setRetry(value => value + 1);
  }

  return (
    <section ref={sectionRef} className="space-y-5 scroll-mt-6" aria-label="Catálogo de livros" aria-busy={loading}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-3xl text-white">{term ? "Resultados da busca" : showSearchForm ? "Confira se o livro já existe" : "Explore os livros"}</h2>
        {searchEnabled && <span className="text-sm text-mist">{books.length} livros</span>}
      </div>
      {showSearchForm && <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1"><span className="sr-only">Título, autor ou ISBN</span><input value={draft} onChange={event => setDraft(event.target.value)} maxLength={200} required placeholder="Busque por título, autor ou ISBN" className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-copper" /></label>
        <button className="rounded-2xl bg-gradient-to-r from-forest to-berry px-6 py-3 font-semibold text-white">Buscar livros</button>
      </form>}
      {!searchEnabled && <p className="text-sm text-mist">Pesquise por título, autor ou ISBN antes de cadastrar um novo livro.</p>}
      {error && <div role="alert" className="rounded-2xl border border-line bg-panelSoft p-4 text-sm text-mist"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} className="mt-2 font-semibold text-copper">Tentar novamente</button></div>}
      {loading && <p role="status" className="text-sm text-mist">Carregando livros…</p>}
      {searchEnabled && !loading && !error && books.length === 0 && <p className="rounded-2xl border border-dashed border-line p-5 text-mist">{term ? "Nenhum livro encontrado no catálogo. Experimente outro título, autor ou ISBN." : "O catálogo ainda não tem livros. Você pode cadastrar sua primeira leitura."}</p>}
      <div className="grid gap-4 xl:grid-cols-2">{books.map(book => <BookCard key={book._id} book={book} />)}</div>
      {visible && books.length > 0 && <nav aria-label="Páginas da busca de livros" className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-line pt-6 sm:gap-6">
        <div className="flex justify-end">
          {page > 1 && <button type="button" disabled={loading} onClick={() => requestPage(page - 1)} className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-panel px-3 py-2.5 text-sm font-semibold text-mist transition hover:border-copper/50 hover:bg-panelSoft hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-midnight disabled:pointer-events-none disabled:opacity-40 sm:px-5">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 transition-transform motion-safe:group-hover:-translate-x-0.5"><path d="m14 6-6 6 6 6" /></svg>
            Anterior
          </button>}
        </div>
        <span aria-current="page" className="flex flex-col items-center gap-0.5 px-1 text-xs text-mist sm:px-3">Página<span className="text-base font-semibold tabular-nums text-white">{page}</span></span>
        <div className="flex justify-start">
          <button type="button" disabled={loading || !visible.hasMore} onClick={() => requestPage(page + 1)} className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-panel px-3 py-2.5 text-sm font-semibold text-mist transition hover:border-copper/50 hover:bg-panelSoft hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-midnight disabled:pointer-events-none disabled:opacity-40 sm:px-5">
            Próxima
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 transition-transform motion-safe:group-hover:translate-x-0.5"><path d="m10 6 6 6-6 6" /></svg>
          </button>
        </div>
      </nav>}
    </section>
  );
}
