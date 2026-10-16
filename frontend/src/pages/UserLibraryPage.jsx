import { useRef } from "react";
import { Link, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import BookCover from "../components/BookCover";
import useUserProfile, { readingTabs } from "../hooks/useUserProfile";

export default function UserLibraryPage() {
  const { id } = useParams();
  const { currentUserId } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const { profile, error, refresh } = useUserProfile(id);
  const tabs = useRef([]);
  const touch = useRef(null);
  const activeIndex = Math.max(0, readingTabs.findIndex(tab => tab.key === params.get("status")));

  function selectTab(index, focus = false) {
    const next = Math.max(0, Math.min(2, index));
    setParams({ status: readingTabs[next].key }, { replace: true });
    if (focus) tabs.current[next]?.focus();
  }

  function handleKeyDown(event) {
    const next = event.key === "ArrowRight" ? (activeIndex + 1) % 3 : event.key === "ArrowLeft" ? (activeIndex + 2) % 3 : event.key === "Home" ? 0 : event.key === "End" ? 2 : null;
    if (next !== null) { event.preventDefault(); selectTab(next, true); }
  }

  if (error) return <div role="alert" className="py-16 text-center"><p className="text-mist">{error}</p><button onClick={refresh} className="mt-4 text-copper">Tentar novamente</button></div>;
  if (!profile) return <p role="status" className="py-16 text-center text-mist">Carregando biblioteca…</p>;

  return (
    <div className="mx-auto max-w-4xl pb-12 pt-2 sm:pt-6">
      <Link to={`/users/${id}`} className="inline-flex items-center gap-2 text-sm text-mist transition hover:text-white"><span aria-hidden="true">←</span> Voltar ao perfil</Link>
      <header className="mb-8 mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Coleção pessoal</p>
        <h1 className="mt-3 font-display text-3xl text-white sm:text-4xl">{id === currentUserId ? "Minha biblioteca" : `Biblioteca de ${profile.usuario.nome}`}</h1>
        <p className="mt-3 text-sm text-mist">Cada leitura, no seu momento.</p>
      </header>
      <div role="tablist" aria-label="Status de leitura" onKeyDown={handleKeyDown} className="relative grid grid-cols-3 border-b border-line">
        {readingTabs.map((tab, index) => <button key={tab.key} ref={node => { tabs.current[index] = node; }} type="button" role="tab" id={`tab-${tab.key}`} aria-controls={`panel-${tab.key}`} aria-selected={index === activeIndex} tabIndex={index === activeIndex ? 0 : -1} onClick={() => selectTab(index)} className={`flex items-center justify-center gap-2 px-1 py-4 text-sm transition sm:gap-3 ${index === activeIndex ? "font-semibold text-white" : "text-mist hover:text-white"}`}>
          {tab.label}<span className={`rounded-md px-1.5 py-0.5 text-xs tabular-nums ${index === activeIndex ? "bg-copper/15 text-copper" : "bg-white/5"}`}>{profile.leituras[tab.key]?.length || 0}</span>
        </button>)}
        <span aria-hidden="true" className="absolute bottom-0 left-0 h-0.5 w-1/3 bg-copper transition-transform duration-300 ease-out" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      </div>
      <div className="overflow-hidden" style={{ touchAction: "pan-y" }} onTouchStart={event => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={event => {
        if (!touch.current) return;
        const dx = event.changedTouches[0].clientX - touch.current.x;
        const dy = event.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) selectTab(activeIndex + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}>
        <div className="flex items-start transition-transform duration-300 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {readingTabs.map((tab, index) => {
            const items = (profile.leituras[tab.key] || []).filter(reading => reading.livro);
            const active = index === activeIndex;
            return <section key={tab.key} id={`panel-${tab.key}`} role="tabpanel" aria-labelledby={`tab-${tab.key}`} aria-hidden={!active} inert={active ? undefined : ""} tabIndex={active ? 0 : -1} className={`w-full min-w-0 shrink-0 ${active ? "" : "max-h-0 overflow-hidden"}`}>
              <p className="pb-2 pt-6 text-sm text-mist">{tab.description}</p>
              {items.length > 0 ? <ul className="divide-y divide-line/60">{items.map(reading => <li key={reading._id}>
                <Link to={`/books/${reading.livro._id}`} className="group flex items-center gap-4 rounded-lg py-5 transition hover:bg-white/[0.025] sm:gap-6 sm:px-3">
                  <div className="h-28 w-20 shrink-0 overflow-hidden rounded-md bg-panelSoft"><BookCover url={reading.livro.urlCapa} title={reading.livro.titulo} className="h-full w-full object-cover" /></div>
                  <div className="min-w-0 flex-1"><h2 className="font-display text-xl leading-snug text-white transition group-hover:text-copper">{reading.livro.titulo}</h2><p className="mt-1 text-sm text-mist">{reading.livro.autor}</p>{reading.nota != null && <p className="mt-3 text-sm text-copper"><span aria-hidden="true">★ </span><span className="sr-only">Nota </span>{reading.nota}<span className="text-mist"> / 5</span></p>}</div>
                  <span aria-hidden="true" className="text-mist transition group-hover:translate-x-1 group-hover:text-copper">→</span>
                </Link>
              </li>)}</ul> : <div className="flex flex-col items-center px-4 py-20 text-center">
                <svg aria-hidden="true" className="mb-5 h-10 w-10 text-copper/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2Z" /></svg>
                <h2 className="font-display text-2xl text-white">Nenhum livro por aqui ainda</h2><p className="mt-2 max-w-xs text-sm leading-relaxed text-mist">{tab.empty}</p>
                {id === currentUserId && <Link to="/" className="mt-6 rounded-lg bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-berry">Explorar livros</Link>}
              </div>}
            </section>;
          })}
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-mist/70 sm:hidden">Deslize para os lados para trocar de lista</p>
    </div>
  );
}
