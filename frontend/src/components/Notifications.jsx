import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Notifications({ currentUserId }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [marking, setMarking] = useState(false);
  const root = useRef(null);
  const button = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await api.get("/notifications", { signal: controller.signal });
        if (!controller.signal.aborted) { setData(response.data); setError(""); }
      } catch { if (!controller.signal.aborted) setError("Não foi possível carregar as notificações."); }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [open, version, currentUserId]);
  useEffect(() => {
    if (!open) return;
    function outside(event) { if (!root.current?.contains(event.target)) setOpen(false); }
    function escape(event) { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  async function markRead() {
    setMarking(true);
    try {
      await api.patch("/notifications/read", null, { params: { before: data.checkedAt } });
      setData(current => ({ ...current, unread: 0, items: current.items.map(item => ({ ...item, lida: true })) }));
      setVersion(value => value + 1);
    } catch { setError("Não foi possível marcar as notificações como lidas."); }
    finally { setMarking(false); }
  }
  const actions = { follow: "começou a seguir você", like: "curtiu sua publicação", comment: "comentou na sua publicação" };
  return <div ref={root} className="relative">
    <button ref={button} type="button" aria-label={`Notificações${data?.unread ? `: ${data.unread} não lidas` : ""}`} aria-expanded={open} aria-controls="notifications-panel" onClick={() => setOpen(value => !value)} className="relative flex h-11 w-11 items-center justify-center rounded-lg text-mist hover:bg-panelSoft hover:text-white focus-visible:outline-copper">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      {data?.unread > 0 && <span className="absolute right-0 top-0 rounded-full bg-berry px-1.5 text-[10px] font-bold leading-4 text-white">{data.unread > 99 ? "99+" : data.unread}</span>}
    </button>
    {open && <section id="notifications-panel" aria-label="Notificações" className="fixed left-4 right-4 top-20 z-50 max-h-[70dvh] overflow-y-auto rounded-2xl border border-line bg-panel p-4 shadow-card sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-xl text-white">Notificações</h2>{data?.unread > 0 && <button type="button" disabled={marking} onClick={markRead} className="text-xs text-copper disabled:opacity-50">{marking ? "Salvando…" : "Marcar como lidas"}</button>}</div>
      {error && <p role="alert" className="mb-3 text-sm text-mist">{error} <button type="button" onClick={() => setVersion(value => value + 1)} className="text-copper underline">Tentar novamente</button></p>}
      {!data && !error && <p role="status" className="text-sm text-mist">Carregando…</p>}
      {data?.items.length === 0 && <p className="py-4 text-sm text-mist">Novos seguidores, curtidas e comentários aparecerão aqui.</p>}
      <ul className="space-y-2">{data?.items.map(item => <li key={item._id}>
        <Link onClick={() => setOpen(false)} to={item.tipo === "follow" ? `/users/${item.ator._id}` : `/users/${currentUserId}#post-${item.publicacao}`} className={`block rounded-xl p-3 text-sm hover:bg-panelSoft focus-visible:outline-copper ${item.lida ? "text-mist" : "bg-white/5 text-ink"}`}>
          <span className="font-semibold">{item.ator.nome}</span> {actions[item.tipo]}{!item.lida && <span className="ml-2 text-copper" aria-label="Não lida">●</span>}
          {item.texto && <p className="mt-1 truncate text-mist">{item.texto}</p>}
          <time dateTime={item.createdAt} className="mt-1 block text-xs text-mist">{new Date(item.createdAt).toLocaleString("pt-BR")}</time>
        </Link>
      </li>)}</ul>
    </section>}
  </div>;
}
