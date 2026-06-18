import { Link } from "react-router-dom";

function BookCard({ book }) {
  return (
    <article className="rounded-3xl border border-line bg-panel p-4 text-ink shadow-card">
      <div className="mb-4 flex h-48 items-center justify-center rounded-2xl bg-panelSoft p-3">
        <img
          src={book.urlCapa}
          alt={book.titulo}
          className="h-full w-full rounded-xl object-contain"
        />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
        {book.genero}
      </p>
      <h3 className="mt-2 font-display text-2xl text-white">{book.titulo}</h3>
      <p className="text-sm text-[#cfd9e8]">{book.autor}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#d6dfec]">{book.descricao}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-copper">Nota {book.mediaAvaliacoes || 0}/5</span>
        <Link to={`/books/${book._id}`} className="font-semibold text-white transition hover:text-glow">
          Ver livro
        </Link>
      </div>
    </article>
  );
}

export default BookCard;
