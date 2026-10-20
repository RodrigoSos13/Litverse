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
  return <dialog ref={dialog} aria-labelledby="connections-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) { const box = dialog.current.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }} className="m-auto max-h-[80dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-line bg-panel p-5 text-ink shadow-card backdrop:bg-black/70">
    <div className="mb-4 flex items-center justify-between"><h2 id="connections-title" className="font-display text-2xl">{kind === "followers" ? "Seguidores" : "Seguindo"}</h2><button type="button" onClick={onClose} aria-label="Fechar lista" className="h-10 w-10 rounded-lg text-xl text-mist hover:bg-panelSoft">×</button></div>
    {error ? <p role="alert" className="text-sm text-mist">Não foi possível carregar a lista. <button type="button" onClick={() => setVersion(value => value + 1)} className="text-copper underline">Tentar novamente</button></p> : !data ? <p role="status" className="text-sm text-mist">Carregando…</p> : <>
      {!data.users.length && <p className="py-5 text-sm text-mist">{kind === "followers" ? "Ainda não há seguidores." : "Ainda não há perfis nesta lista."}</p>}
      <ul className="space-y-2">{data.users.map(user => <li key={user._id}><Link to={`/users/${user._id}`} onClick={onClose} className="flex items-center gap-3 rounded-xl p-3 hover:bg-panelSoft focus-visible:outline-copper">
        {user.urlAvatar ? <img src={user.urlAvatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/25 text-glow">{user.nome?.slice(0, 1).toUpperCase()}</span>}
        <span className="min-w-0"><span className="block truncate font-semibold">{user.nome}</span><span className="block truncate text-sm text-mist">@{user.usuario}</span></span>
      </Link></li>)}</ul>
      {(page > 1 || data.hasMore) && <div className="mt-4 flex items-center justify-between text-sm"><button type="button" disabled={page === 1} onClick={() => setPage(value => value - 1)} className="text-copper disabled:opacity-40">Anterior</button><span className="text-mist">Página {page}</span><button type="button" disabled={!data.hasMore} onClick={() => setPage(value => value + 1)} className="text-copper disabled:opacity-40">Próxima</button></div>}
    </>}
  </dialog>;
}
