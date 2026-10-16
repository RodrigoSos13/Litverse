import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import BookCard from "./BookCard";

export default function BookCatalog({ query = "", showSearchForm = false }) {
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [navigation, setNavigation] = useState({ term: "", page: 1 });
  const [snapshot, setSnapshot] = useState(null);
  const [status, setStatus] = useState(null);
  const [retry, setRetry] = useState(0);
  const sectionRef = useRef(null);
  const term = (showSearchForm ? submitted : query).trim();
  const requestedPage = navigation.term === term ? navigation.page : 1;
  const visible = snapshot?.term === term ? snapshot : null;
  const books = visible?.livros || [];
  const page = visible?.page || 1;
  const loading = !status || status.term !== term || status.page !== requestedPage || status.loading;
  const error = status?.term === term ? status.error : "";

  useEffect(() => {
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
  }, [term, requestedPage, retry]);

  function requestPage(nextPage) {
    if (loading) return;
    setNavigation({ term, page: nextPage });
    setRetry(value => value + 1);
  }
  function submit(event) {
    event.preventDefault();
    setSubmitted(draft.trim());
    setNavigation({ term: draft.trim(), page: 1 });
    setRetry(value => value + 1);
  }

  return (
    <section ref={sectionRef} className="space-y-5 scroll-mt-6" aria-label="Catálogo de livros" aria-busy={loading}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-3xl text-white">{term ? "Resultados da busca" : "Explore os livros"}</h2>
        <span className="text-sm text-mist">{books.length} livros</span>
      </div>
      {showSearchForm && <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1"><span className="sr-only">Título, autor ou ISBN</span><input value={draft} onChange={event => setDraft(event.target.value)} maxLength={200} required placeholder="Busque por título, autor ou ISBN" className="w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-copper" /></label>
        <button className="rounded-2xl bg-gradient-to-r from-forest to-berry px-6 py-3 font-semibold text-white">Buscar livros</button>
      </form>}
      {error && <div role="alert" className="rounded-2xl border border-line bg-panelSoft p-4 text-sm text-mist"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} className="mt-2 font-semibold text-copper">Tentar novamente</button></div>}
      {loading && <p role="status" className="text-sm text-mist">Carregando livros…</p>}
      {!loading && !error && books.length === 0 && <p className="rounded-2xl border border-dashed border-line p-5 text-mist">{term ? "Nenhum livro encontrado no catálogo. Experimente outro título, autor ou ISBN." : "O catálogo ainda não tem livros. Você pode cadastrar sua primeira leitura."}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{books.map(book => <BookCard key={book._id} book={book} />)}</div>
      {visible && books.length > 0 && <nav aria-label="Páginas da busca de livros" className="flex items-center justify-center gap-4">
        <button disabled={loading || page === 1} onClick={() => requestPage(page - 1)} className="rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-40">← Anterior</button>
        <span className="text-sm text-mist">Página {page}</span>
        <button disabled={loading || !visible.hasMore} onClick={() => requestPage(page + 1)} className="rounded-xl border border-line px-4 py-2 text-sm disabled:opacity-40">Próxima →</button>
      </nav>}
    </section>
  );
}
