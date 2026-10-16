import { Link } from "react-router-dom";
import BookCover from "./BookCover";

function BookCard({ book, onOpen, opening = false, disabled = false }) {
  const unavailable = !book._id && (disabled || opening || !onOpen);
  const openClass = "font-semibold text-white transition-colors after:absolute after:inset-0 after:z-10 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-copper focus-visible:after:ring-offset-4 focus-visible:after:ring-offset-midnight";

  return (
    <article aria-busy={opening || undefined} className={`group relative isolate flex flex-col rounded-3xl border border-line bg-panel p-4 text-ink shadow-card transition-[transform,border-color,box-shadow] duration-200 ease-out ${unavailable ? "" : "hover:border-copper/60 hover:shadow-[0_26px_64px_rgba(2,6,23,0.6)] motion-safe:hover:-translate-y-1 focus-within:border-copper/60"}`}>
      <div className="mb-4 flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-panelSoft p-3">
        <div className={`h-full w-full transition-transform duration-300 ease-out ${unavailable ? "" : "motion-safe:group-hover:scale-[1.04] motion-safe:group-focus-within:scale-[1.04]"}`}>
          <BookCover url={book.urlCapa} title={book.titulo} />
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
        {book.genero}
      </p>
      <h3 className="mt-2 font-display text-2xl text-white">{book.titulo}</h3>
      <p className="text-sm text-[#cfd9e8]">{book.autor}</p>
      {book.idioma && <p className="mt-2 text-xs text-mist">{/^(?:en(?:-[a-z]{2})?|english|inglês|ingles)$/i.test(book.idioma) ? "Edição em inglês" : "Edição em português"}</p>}
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#d6dfec]">{book.descricao}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
        <span className="text-copper">{book.totalAvaliacoes > 0 ? `Nota ${book.mediaAvaliacoes}/5` : "Sem avaliações"}</span>
        {book._id ? <Link to={`/books/${book._id}`} aria-label={`Ver livro: ${book.titulo}`} className={openClass}>
          Ver livro <span aria-hidden="true" className="ml-1 inline-block transition-transform motion-safe:group-hover:translate-x-1">→</span>
        </Link> : <button type="button" disabled={unavailable} onClick={() => onOpen?.(book)} aria-label={`${opening ? "Abrindo" : "Ver livro"}: ${book.titulo}`} className={`${openClass} after:cursor-pointer disabled:opacity-50 disabled:after:cursor-wait`}>
          {opening ? "Abrindo…" : <>Ver livro <span aria-hidden="true" className="ml-1 inline-block transition-transform motion-safe:group-hover:translate-x-1">→</span></>}
        </button>}
      </div>
    </article>
  );
}

export default BookCard;
