import { Link } from "react-router-dom";
import BookCover from "./BookCover";

function BookCard({ book, onOpen, opening = false, disabled = false }) {
  return (
    <article className="flex flex-col rounded-3xl border border-line bg-panel p-4 text-ink shadow-card">
      <div className="mb-4 flex h-48 items-center justify-center rounded-2xl bg-panelSoft p-3">
        <BookCover url={book.urlCapa} title={book.titulo} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
        {book.genero}
      </p>
      <h3 className="mt-2 font-display text-2xl text-white">{book.titulo}</h3>
      <p className="text-sm text-[#cfd9e8]">{book.autor}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#d6dfec]">{book.descricao}</p>
      {book.googleBooksId && book.googleBooksUrl && <a href={book.googleBooksUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-xs text-copper underline">Fonte: Google Books ↗</a>}
      <div className="mt-auto flex items-center gap-3 pt-4 justify-between text-sm">
        <span className="text-copper">{book.totalAvaliacoes > 0 ? `Nota ${book.mediaAvaliacoes}/5` : "Sem avaliações"}</span>
        {book._id ? <Link to={`/books/${book._id}`} className="font-semibold text-white transition hover:text-glow">Ver livro</Link> : <button disabled={disabled} onClick={() => onOpen?.(book)} className="font-semibold text-white transition hover:text-glow disabled:opacity-50">{opening ? "Abrindo…" : "Ver livro"}</button>}
      </div>
    </article>
  );
}

export default BookCard;
