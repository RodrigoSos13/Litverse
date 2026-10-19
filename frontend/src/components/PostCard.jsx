import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function PostCard({ post, currentUserId, onRefresh }) {
  const images = post.imagens?.length ? post.imagens : post.urlImagem ? [post.urlImagem] : [];
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (!currentUserId) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/likes", {
        publicacao: post._id,
        usuario: currentUserId,
      });
      onRefresh?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleComment(event) {
    event.preventDefault();

    if (!currentUserId || !commentText.trim()) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/comments", {
        publicacao: post._id,
        usuario: currentUserId,
        texto: commentText,
      });
      setCommentText("");
      onRefresh?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="mx-auto w-full min-w-0 max-w-[560px] overflow-hidden rounded-2xl border border-line bg-panel p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to={`/users/${post.usuario?._id || post.usuario}`} className="font-semibold text-white transition hover:text-glow">
            {post.usuario?.nome || "Usuario desconhecido"}
          </Link>
          <p className="text-sm text-mist">@{post.usuario?.usuario}</p>
        </div>
        <span className="rounded-full border border-forest/30 bg-forest/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-glow">
          {post.tipo}
        </span>
      </div>

      {post.livro && (
        <Link to={`/books/${post.livro._id || post.livro}`} className="mt-4 block text-sm text-mist">
          Relacionado a {post.livro.titulo}
        </Link>
      )}

      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">{post.texto}</p>

      {images.length > 0 && (
        <div className={`mt-4 grid gap-1 overflow-hidden rounded-xl border border-line/60 bg-midnight ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {images.map((src, index) => <a key={index} href={src} target="_blank" rel="noreferrer" aria-label={`Abrir foto ${index + 1}`} className={images.length === 3 && index === 0 ? "row-span-2" : ""}>
            <img src={src} alt={`Imagem ${index + 1} da publicação`} loading="lazy" className={images.length === 1 ? "block max-h-[640px] w-full object-contain" : "h-full min-h-0 w-full object-cover max-h-80"} />
          </a>)}
        </div>
      )}

      <div className="mt-4 flex gap-4 text-sm text-mist">
        <span>{post.totalCurtidas} curtidas</span>
        <span>{post.totalComentarios} comentarios</span>
      </div>

      {currentUserId && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={loading}
              className="rounded-full border border-line bg-panelSoft px-4 py-2 text-sm font-semibold text-glow transition hover:border-forest hover:text-white disabled:opacity-60"
            >
              Curtir post
            </button>
          </div>

          <form className="mt-3 flex gap-2" onSubmit={handleComment}>
            <input
              type="text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Escreva um comentario"
              className="min-w-0 flex-1 rounded-full border border-line bg-panelSoft px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-gradient-to-r from-forest to-berry px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Comentar
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default PostCard;
