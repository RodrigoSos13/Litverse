import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ConnectionsDialog({ userId, kind, onClose }) {
  const dialog = useRef(null);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(false);
    api.get(`/users/${userId}/${kind}`, { params: { page }, signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setData(data);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [userId, kind, page, version]);
  return <dialog ref={dialog} aria-labelledby="connections-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) { const box = dialog.current.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }} className="m-auto max-h-[80dvh] w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-white/10 bg-panel p-0 text-ink shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm">
    <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
      <h2 id="connections-title" className="text-base font-semibold tracking-tight text-white">{kind === "followers" ? "Seguidores" : "Seguindo"}</h2>
      <button type="button" onClick={onClose} aria-label="Fechar lista" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mist transition hover:bg-white/5 hover:text-white focus-visible:outline-copper"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    </div>
    <div className="max-h-[55dvh] overflow-y-auto overscroll-contain p-3">
    {error ? <p role="alert" className="rounded-xl bg-white/5 p-4 text-sm text-mist">Não foi possível carregar a lista. <button type="button" onClick={() => setVersion(value => value + 1)} className="text-copper underline">Tentar novamente</button></p> : !data ? <p role="status" className="py-10 text-center text-sm text-mist">Carregando conexões…</p> : <>
      {!data.users.length && <p className="px-4 py-12 text-center text-sm text-mist">{kind === "followers" ? "Ainda não há seguidores." : "Ainda não há perfis nesta lista."}</p>}
      <ul className="divide-y divide-white/5">{data.users.map(user => <li key={user._id}><Link to={`/users/${user._id}`} onClick={onClose} className="group flex items-center gap-3 rounded-xl px-3 py-4 transition hover:bg-white/5 focus-visible:outline-copper">
        {user.urlAvatar ? <img src={user.urlAvatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-white/10" /> : <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-panelSoft font-semibold text-slate-300 ring-1 ring-white/10">{user.nome?.slice(0, 1).toUpperCase()}</span>}
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-100">{user.nome}</span><span className="mt-1 block truncate text-xs text-mist">@{user.usuario}</span></span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-mist/50 transition group-hover:translate-x-0.5 group-hover:text-white"><path d="m9 5 7 7-7 7" /></svg>
      </Link></li>)}</ul>
      {(page > 1 || data.hasMore) && <div className="mt-3 flex items-center justify-between border-t border-line px-3 pt-4 text-xs"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)} className="rounded-lg border border-line px-3 py-2 text-slate-300 hover:bg-panelSoft disabled:opacity-30">Anterior</button><span className="text-mist">Página {page}</span><button type="button" disabled={!data.hasMore} onClick={() => setPage(value => value + 1)} className="rounded-lg border border-line px-3 py-2 text-slate-300 hover:bg-panelSoft disabled:opacity-30">Próxima</button></div>}
    </>}
    </div>
  </dialog>;
}
