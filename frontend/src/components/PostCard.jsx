import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import BookCover from "./BookCover";

function PostCard({ post, currentUserId }) {
  const images = post.imagens?.length ? post.imagens : post.urlImagem ? [post.urlImagem] : [];
  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => { setAvatarFailed(false); }, [post.usuario?.urlAvatar]);
  const [commentText, setCommentText] = useState("");
  const [liking, setLiking] = useState(false);
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(Boolean(post.curtido));
  const [likeCount, setLikeCount] = useState(post.totalCurtidas || 0);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(post.totalComentarios || 0);
  const [showComments, setShowComments] = useState(post.totalComentarios > 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setLiked(Boolean(post.curtido));
    setLikeCount(post.totalCurtidas || 0);
  }, [post.curtido, post.totalCurtidas]);

  useEffect(() => {
    if (!showComments) return;
    const controller = new AbortController();
    setLoadingComments(true);
    setCommentsError("");
    api.get("/comments", { params: { post: post._id }, signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) { setComments(data); setCommentCount(data.length); }
      })
      .catch(() => { if (!controller.signal.aborted) setCommentsError("Não foi possível carregar os comentários."); })
      .finally(() => { if (!controller.signal.aborted) setLoadingComments(false); });
    return () => controller.abort();
  }, [post._id, showComments, retry]);

  async function handleLike() {
    if (!currentUserId || liking) return;
    setLiking(true);
    setError("");
    try {
      if (liked) await api.delete(`/likes/${post._id}/${currentUserId}`);
      else await api.post("/likes", { publicacao: post._id });
      setLiked(!liked);
      setLikeCount(count => Math.max(0, count + (liked ? -1 : 1)));
    } catch {
      setError("Não foi possível atualizar sua curtida. Tente novamente.");
    } finally { setLiking(false); }
  }

  async function handleComment(event) {
    event.preventDefault();
    if (!currentUserId || !commentText.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const { data } = await api.post("/comments", { publicacao: post._id, texto: commentText.trim() });
      setComments(current => [data, ...current.filter(comment => comment._id !== data._id)]);
      setCommentCount(count => count + 1);
      setShowComments(true);
      setRetry(value => value + 1);
      setCommentText("");
    } catch {
      setError("Não foi possível enviar o comentário. Tente novamente.");
    } finally { setSending(false); }
  }

  return (
    <article className="mx-auto w-full min-w-0 max-w-[560px] rounded-2xl border border-line bg-panel p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/users/${post.usuario?._id || post.usuario}`} className="flex min-w-0 items-center gap-3 rounded-lg text-white transition hover:text-glow">
          {post.usuario?.urlAvatar && !avatarFailed ? (
            <img src={post.usuario.urlAvatar} alt="" onError={() => setAvatarFailed(true)} className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-line" />
          ) : <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest/25 font-display text-xl text-glow">{post.usuario?.nome?.slice(0, 1).toUpperCase() || "L"}</span>}
          <div className="min-w-0">
            <p className="truncate font-semibold">{post.usuario?.nome || "Usuário desconhecido"}</p>
            {post.usuario?.usuario && <p className="truncate text-sm text-mist">@{post.usuario.usuario}</p>}
          </div>
        </Link>
        <span className="rounded-full border border-forest/30 bg-forest/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-glow">
          {post.tipo}
        </span>
      </div>

      {post.livro && (
        <p className="mt-4 text-sm text-mist">
          Livro: {" "}
          <span className="group relative inline-block max-w-full align-bottom">
            <Link to={`/books/${post.livro._id || post.livro}`} className="rounded-sm text-copper underline-offset-4 hover:underline focus-visible:underline">
              {post.livro.titulo}
            </Link>
            <span aria-hidden="true" className="pointer-events-none invisible absolute bottom-full left-0 z-30 w-36 translate-y-1 pb-3 opacity-0 transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <span className="block aspect-[2/3] overflow-hidden rounded-xl border border-line bg-panel p-2 shadow-card">
                <BookCover url={post.livro.urlCapa} title={post.livro.titulo} />
              </span>
            </span>
          </span>
        </p>
      )}

      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">{post.texto}</p>

      {images.length > 0 && (
        <div className={`mt-4 grid gap-1 overflow-hidden rounded-xl border border-line/60 bg-midnight ${images.length > 1 ? "aspect-square grid-cols-2 grid-rows-2" : "grid-cols-1"}`}>
          {images.map((src, index) => <a key={index} href={src} target="_blank" rel="noreferrer" aria-label={`Abrir foto ${index + 1}`} className={`relative block min-h-0 min-w-0 overflow-hidden ${images.length === 2 || (images.length === 3 && index === 0) ? "row-span-2" : ""}`}>
            <img src={src} alt={`Imagem ${index + 1} da publicação`} loading="lazy" className={images.length === 1 ? "block h-auto w-full" : "absolute inset-0 block h-full w-full object-cover"} />
          </a>)}
        </div>
      )}

      <div className="mt-4 flex items-center gap-5 border-t border-line/60 pt-3 text-sm text-mist">
        <button type="button" onClick={handleLike} disabled={!currentUserId || liking} aria-label={liked ? "Descurtir publicação" : "Curtir publicação"} aria-pressed={liked} className={`inline-flex items-center gap-2 rounded-lg p-2 transition hover:bg-forest/10 hover:text-forest disabled:opacity-50 ${liked ? "text-forest" : "text-mist"}`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
          <span className="tabular-nums">{likeCount}<span className="sr-only"> curtidas</span></span>
        </button>
        <button type="button" onClick={() => setShowComments(current => !current)} aria-expanded={showComments} aria-controls={`comments-${post._id}`} className="inline-flex items-center gap-2 rounded-lg p-2 hover:bg-panelSoft hover:text-ink">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2v-10A9 9 0 0 1 21 11.5Z" /></svg>
          {commentCount} {commentCount === 1 ? "comentário" : "comentários"}
        </button>
      </div>

      {showComments && <div id={`comments-${post._id}`} className="mt-3 space-y-3 border-t border-line/60 pt-4">
        {loadingComments && <p role="status" className="text-xs text-mist">Carregando comentários…</p>}
        {commentsError && <div role="alert" className="text-sm text-red-300">{commentsError}<button type="button" onClick={() => setRetry(value => value + 1)} className="ml-2 underline">Tentar novamente</button></div>}
        {!loadingComments && !commentsError && !comments.length && <p className="text-sm text-mist">Comece a conversa. Deixe o primeiro comentário.</p>}
        {comments.map(comment => <div key={comment._id} className="rounded-xl bg-panelSoft/60 px-4 py-3">
          <Link to={`/users/${comment.usuario?._id || comment.usuario}`} className="text-sm font-semibold text-ink hover:text-copper">{comment.usuario?.nome || "Leitor"}</Link>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-mist">{comment.texto}</p>
        </div>)}
      </div>}

      {currentUserId && <form className="mt-4 flex gap-2" onSubmit={handleComment}>
        <label htmlFor={`comment-${post._id}`} className="sr-only">Escreva um comentário</label>
        <input id={`comment-${post._id}`} type="text" maxLength={500} disabled={sending} value={commentText} onChange={event => setCommentText(event.target.value)} placeholder="Escreva um comentário…" className="min-w-0 flex-1 rounded-full border border-line bg-panelSoft px-4 py-2 text-sm outline-none focus:border-copper" />
        <button type="submit" disabled={sending || !commentText.trim()} className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-berry disabled:opacity-50">{sending ? "Enviando…" : "Enviar"}</button>
      </form>}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </article>
  );
}

export default PostCard;
