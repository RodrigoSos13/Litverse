import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Notifications({ currentUserId }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [marking, setMarking] = useState(false);
  const navigate = useNavigate();
  const revision = useRef(0);
  const [reading, setReading] = useState(null);
  const root = useRef(null);
  const button = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const started = revision.current;
      try {
        const response = await api.get("/notifications", { signal: controller.signal });
        if (!controller.signal.aborted && started === revision.current) { setData(response.data); setError(""); }
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
    revision.current++;
    try {
      await api.patch("/notifications/read", null, { params: { before: data.checkedAt } });
      revision.current++;
      const cutoff = new Date(data.checkedAt);
      setData(current => ({ ...current, unread: Math.max(0, current.unread - data.unread), items: current.items.map(item => new Date(item.createdAt) <= cutoff ? { ...item, lida: true } : item) }));
      setVersion(value => value + 1);
    } catch { setError("Não foi possível marcar as notificações como lidas."); }
    finally { setMarking(false); }
  }
  async function openNotification(item) {
    if (reading || marking) return;
    setReading(item._id);
    setError("");
    revision.current++;
    try {
      if (!item.lida) {
        await api.patch(`/notifications/${item._id}/read`);
        revision.current++;
        setData(current => {
          const unread = current.items.some(entry => entry._id === item._id && !entry.lida);
          return { ...current, unread: Math.max(0, current.unread - Number(unread)), items: current.items.map(entry => entry._id === item._id ? { ...entry, lida: true } : entry) };
        });
      }
      setOpen(false);
      navigate(item.tipo === "follow" ? `/users/${item.ator._id}` : `/users/${currentUserId}#post-${item.publicacao}`);
    } catch { setError("Não foi possível marcar esta notificação como lida. Tente novamente."); }
    finally { setReading(null); setVersion(value => value + 1); }
  }
  function relativeDate(value) {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 1) return "Agora";
    if (minutes < 60) return `Há ${minutes} min`;
    if (minutes < 1440) return `Há ${Math.floor(minutes / 60)} h`;
    return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }
  const actions = { follow: "começou a seguir você", like: "curtiu sua publicação", comment: "comentou na sua publicação" };
  return <div ref={root} className="relative">
    <button ref={button} type="button" aria-label={`Notificações${data?.unread ? `: ${data.unread} não lidas` : ""}`} aria-expanded={open} aria-controls="notifications-panel" onClick={() => setOpen(value => !value)} className="relative flex h-11 w-11 items-center justify-center rounded-lg text-mist hover:bg-panelSoft hover:text-white focus-visible:outline-copper">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      {data?.unread > 0 && <span className="absolute right-0 top-0 rounded-full bg-berry px-1.5 text-[10px] font-bold leading-4 text-white">{data.unread > 99 ? "99+" : data.unread}</span>}
    </button>
    {open && <section id="notifications-panel" aria-label="Notificações" className="fixed left-4 right-4 top-20 z-50 overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[25rem]">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-white">Notificações</h2>
          <button type="button" onClick={() => { setOpen(false); button.current?.focus(); }} aria-label="Fechar notificações" className="flex h-8 w-8 items-center justify-center rounded-lg text-mist hover:bg-white/5 hover:text-white focus-visible:outline-copper"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-xs text-mist">{data?.unread ? `${data.unread} não ${data.unread === 1 ? "lida" : "lidas"}` : "Você está em dia"}</p>
          {data?.unread > 0 && <button type="button" disabled={marking || Boolean(reading)} onClick={markRead} className="rounded-md text-xs font-medium text-slate-300 transition hover:text-white focus-visible:outline-copper disabled:opacity-50">{marking ? "Salvando…" : "Marcar todas como lidas"}</button>}
        </div>
      </div>
      <div className="max-h-[60dvh] overflow-y-auto overscroll-contain p-2">
        {error && <p role="alert" className="m-2 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error} <button type="button" onClick={() => setVersion(value => value + 1)} className="underline">Atualizar</button></p>}
        {!data && !error && <p role="status" className="px-3 py-8 text-center text-sm text-mist">Carregando notificações…</p>}
        {data?.items.length === 0 && <div className="px-6 py-10 text-center"><div aria-hidden="true" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-mist"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg></div><p className="text-sm font-medium text-white">Tudo tranquilo por aqui</p><p className="mt-2 text-xs leading-relaxed text-mist">Seus novos seguidores, curtidas e comentários aparecerão aqui.</p></div>}
        <ul className="space-y-1">{data?.items.map(item => <li key={item._id}>
          <button type="button" disabled={Boolean(reading) || marking} onClick={() => openNotification(item)} className={`group flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-white/5 focus-visible:outline-copper disabled:opacity-60 ${item.lida ? "text-mist" : "bg-white/[0.03] text-ink"}`}>
            <span className="relative shrink-0">
              {item.ator.urlAvatar ? <img src={item.ator.urlAvatar} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10" /> : <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-panelSoft text-base font-semibold text-slate-300 ring-1 ring-white/10">{item.ator.nome?.slice(0, 1).toUpperCase()}</span>}
              <span aria-hidden="true" className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-panel ${item.tipo === "like" ? "bg-berry text-white" : "bg-forest text-white"}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">{item.tipo === "like" ? <path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-4 4 1 9 8 15 7-6 12-11 8-15Z" /> : item.tipo === "comment" ? <path d="M21 11a9 9 0 0 1-13 8l-5 2 2-5a9 9 0 1 1 16-5Z" /> : <><circle cx="9" cy="7" r="4" /><path d="M2 21v-2a7 7 0 0 1 14 0v2M20 8v6m-3-3h6" /></>}</svg></span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-relaxed"><span className="font-semibold text-slate-100">{item.ator.nome}</span> {actions[item.tipo]}</span>
              {item.texto && <span className="mt-2 block truncate rounded-lg border-l-2 border-white/15 bg-midnight/40 px-3 py-2 text-xs text-mist">{item.texto}</span>}
              <time dateTime={item.createdAt} title={new Date(item.createdAt).toLocaleString("pt-BR")} className="mt-1.5 block text-[11px] text-mist/70">{reading === item._id ? "Abrindo…" : relativeDate(item.createdAt)}</time>
            </span>
            {!item.lida && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-label="Não lida" />}
          </button>
        </li>)}</ul>
      </div>
      {Boolean(data?.items.length) && <p className="border-t border-line px-5 py-3 text-center text-[11px] text-mist/70">Suas interações mais recentes</p>}
    </section>}
  </div>;
}
