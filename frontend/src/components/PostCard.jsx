import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function PostCard({ post, currentUserId, onRefresh }) {
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
    <article className="rounded-3xl border border-line bg-panel p-5 shadow-card">
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

      {post.urlImagem && (
        <img
          src={post.urlImagem}
          alt={post.tipo}
          className="mt-4 max-h-80 w-full rounded-2xl object-cover"
        />
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

          <form className="mt-3 flex gap-3" onSubmit={handleComment}>
            <input
              type="text"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Escreva um comentario"
              className="flex-1 rounded-full border border-line bg-panelSoft px-4 py-2 text-sm"
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
