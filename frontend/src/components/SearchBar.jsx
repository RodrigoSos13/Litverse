import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import BookCover from "./BookCover";

export default function SearchBar({ value = "", onSubmit, onSelect, disabled = false, inputId, placement = "bottom", className = "relative col-span-2 row-start-2 w-full lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:max-w-xl" }) {
  const navigate = useNavigate();
  const Container = onSelect ? "div" : "form";
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState(null);
  const listId = useId();
  const term = draft.trim();
  const current = result?.term === term ? result : null;
  const books = current?.books || [];
  const expanded = focused && term.length >= 2;

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (!focused || term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/books/catalog", { params: { search: term, page: 1 }, signal: controller.signal, timeout: 10000 });
        if (!controller.signal.aborted) setResult({ term, books: data.livros.slice(0, 5) });
      } catch {
        if (!controller.signal.aborted) setResult({ term, books: [], error: true });
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term, focused]);

  function confirm(book) {
    if (!book && !onSubmit) {
      setFocused(true);
      return;
    }
    setFocused(false);
    setActive(-1);
    if (book) {
      setDraft(value);
      if (onSelect) { onSelect(book); return; }
      navigate(`/books/${book._id}`);
      return;
    }
    setDraft(term);
    onSubmit(term);
  }
  function handleKeyDown(event) {
    if (event.key === "Escape") { setFocused(false); setActive(-1); }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && books.length) {
      event.preventDefault();
      setFocused(true);
      setActive(index => event.key === "ArrowDown" ? (index + 1) % books.length : (index <= 0 ? books.length - 1 : index - 1));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      confirm(expanded && active >= 0 ? books[active] : null);
    }
  }

  return (
    <Container role={onSelect ? undefined : "search"} className={className} onSubmit={onSelect ? undefined : event => { event.preventDefault(); confirm(); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setFocused(false); setActive(-1); } }}>
      <label htmlFor={inputId || `${listId}-input`} className="sr-only">Pesquisar livros</label>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-mist"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
      <input id={inputId || `${listId}-input`} disabled={disabled} type="search" role="combobox" aria-autocomplete="list" aria-expanded={expanded} aria-controls={listId} aria-activedescendant={expanded && active >= 0 && books[active] ? `${listId}-${active}` : undefined} autoComplete="off" maxLength={200} value={draft} onChange={event => { setDraft(event.target.value); setFocused(true); setActive(-1); }} onFocus={() => setFocused(true)} onKeyDown={handleKeyDown} placeholder="Pesquisar por título, autor ou ISBN" className="h-11 w-full rounded-lg border border-line/70 bg-panel/80 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-mist/70 hover:border-mist/40 focus:border-copper focus:ring-2 focus:ring-copper/15" />
      {expanded && <div className={`absolute inset-x-0 z-50 max-h-[min(24rem,50vh)] overflow-y-auto rounded-2xl border border-line bg-panel shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${placement === "top" ? "bottom-full mb-3" : "top-full mt-3"}`}>
        <div className="flex items-center justify-between border-b border-line/70 px-4 py-3"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-copper">No catálogo</span><span className="text-xs text-mist">{onSelect ? "Selecione para vincular" : "Sugestões de leitura"}</span></div>
        <ul id={listId} role="listbox" aria-label="Sugestões de livros" className="p-2">
          {books.map((book, index) => <li key={book._id} id={`${listId}-${index}`} role="option" aria-selected={active === index} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => confirm(book)} className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition ${active === index ? "bg-panelSoft" : "hover:bg-panelSoft"}`}>
            <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-midnight"><BookCover url={book.urlCapa} title={book.titulo} /></div>
            <div className="min-w-0 flex-1"><p className="line-clamp-2 font-display text-base text-white">{book.titulo}</p><p className="mt-1 truncate text-xs text-mist">{book.autor}</p></div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-mist" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>
          </li>)}
        </ul>
        {!books.length && <p role="status" className="px-5 pb-5 pt-2 text-sm text-mist">{!current ? "Buscando sugestões…" : current.error ? "Sugestões indisponíveis no momento." : "Nenhum livro encontrado. Experimente outro título ou autor."}</p>}

      </div>}
    </Container>
  );
}
