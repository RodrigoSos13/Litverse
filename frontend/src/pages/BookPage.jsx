import { useEffect, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import api from "../services/api";
import BookCover from "../components/BookCover";
import StarRating from "../components/StarRating";
import FanartComposer from "../components/FanartComposer";

const initialReadingForm = {
  status: null,
  nota: "",
};

const statusLabels = {
  quero_ler: "Quero ler",
  lendo: "Lendo",
  lido: "Lido",
};

function BookPage() {
  const { id } = useParams();
  const { currentUserId } = useOutletContext();
  const [data, setData] = useState(null);
  const [readingForm, setReadingForm] = useState(initialReadingForm);
  const [savedStatus, setSavedStatus] = useState(null);
  const [savingReading, setSavingReading] = useState(false);
  const [activeReadingMenu, setActiveReadingMenu] = useState(null);

  const readingActionsRef = useRef(null);
  const readingTriggerRef = useRef(null);

  useEffect(() => {
    if (!activeReadingMenu) return;
    function dismiss(event) {
      if (!readingActionsRef.current?.contains(event.target)) setActiveReadingMenu(null);
    }
    function escape(event) {
      if (event.key === "Escape") {
        setActiveReadingMenu(null);
        readingTriggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [activeReadingMenu]);

  function loadBookPage() {
    return api.get(`/books/${id}`).then((response) => setData(response.data));
  }

  useEffect(() => {
    loadBookPage().catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!currentUserId) {
      setReadingForm(initialReadingForm);
      setSavedStatus(null);
      return;
    }

    const controller = new AbortController();
    setSavedStatus(null);
    setReadingForm(initialReadingForm);
    api
      .get("/readings", {
        params: {
          user: currentUserId,
          book: id,
        },
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return;
        const reading = response.data[0];
        setSavedStatus(reading?.status || null);

        setReadingForm({
          status: reading?.status || null,
          nota: reading?.nota ?? "",
        });
      })
      .catch(error => { if (!controller.signal.aborted) console.error(error); });
    return () => controller.abort();
  }, [currentUserId, id]);

  if (!data) {
    return <p>Carregando livro...</p>;
  }

  const statsMap = data.estatisticasLeitura.reduce((accumulator, item) => {
    accumulator[item._id] = item.count;
    return accumulator;
  }, {});
  const fanarts = data.posts.filter((post) => post.tipo === "fanart");

  async function handleRatingSubmit(event) {
    event.preventDefault();

    if (!currentUserId) {
      return;
    }

    setSavingReading(true);

    try {
      await api.post("/readings", {
        usuario: currentUserId,
        livro: id,
        status: readingForm.status,
        nota: readingForm.nota === "" ? null : Number(readingForm.nota),
      });
      setSavedStatus(readingForm.status);
      await loadBookPage();
      setActiveReadingMenu(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingReading(false);
    }
  }

  async function handleStatusSubmit(nextStatus) {
    if (!currentUserId) {
      return;
    }

    setSavingReading(true);

    try {
      await api.post("/readings", {
        usuario: currentUserId,
        livro: id,
        status: nextStatus,
        nota: readingForm.nota === "" ? null : Number(readingForm.nota),
      });
      setReadingForm((current) => ({ ...current, status: nextStatus }));
      setSavedStatus(nextStatus);
      await loadBookPage();
      setActiveReadingMenu(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingReading(false);
    }
  }


  return (
    <div className="space-y-6">
      <section className="grid gap-6 rounded-[2rem] border border-line bg-panel p-8 shadow-card lg:grid-cols-[260px_1fr]">
        <div>
          <div className="relative flex h-96 items-center justify-center rounded-3xl bg-panelSoft p-4">
            <BookCover url={data.livro.urlCapa} title={data.livro.titulo} className="h-full w-full rounded-2xl object-contain" />
            <div
              className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-copper/30 bg-midnight/90 px-3 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm"
              aria-label={data.livro.totalAvaliacoes > 0 ? `Avaliação média: ${data.livro.mediaAvaliacoes} de 5, ${data.livro.totalAvaliacoes} ${data.livro.totalAvaliacoes === 1 ? "avaliação" : "avaliações"}` : "Sem avaliações"}
              title={data.livro.totalAvaliacoes > 0 ? `${data.livro.totalAvaliacoes} avaliações` : "Sem avaliações ainda"}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-copper"><path d="m12 2.5 2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96L12 2.5Z" /></svg>
              {data.livro.totalAvaliacoes > 0 && <span className="tabular-nums">{Number(data.livro.mediaAvaliacoes || 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>}
              <span className="text-[10px] font-normal text-mist/80">{data.livro.totalAvaliacoes > 0 ? `(${Number(data.livro.totalAvaliacoes).toLocaleString("pt-BR")} ${data.livro.totalAvaliacoes === 1 ? "avaliação" : "avaliações"})` : "(0 avaliações)"}</span>
            </div>
          </div>

          <dl aria-label="Leituras da comunidade" className="mt-5 space-y-3 px-1">
            {[
              { key: "lido", label: "Já leram", icon: <><path d="M20 11.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /><path d="m10 9 3 3 8-8M4 17h16" /></> },
              { key: "lendo", label: "Lendo agora", icon: <><path d="M12 5v15M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Z" /></> },
              { key: "quero_ler", label: "Querem ler", icon: <path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-4-6 4V4Z" /> },
            ].map(({ key, label, icon }) => (
              <div key={key} className="flex items-center gap-3">
                <dt className="flex shrink-0 items-center gap-2.5 text-xs text-mist">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-mist/70" aria-hidden="true">{icon}</svg>
                  {label}
                </dt>
                <span className="h-px min-w-2 flex-1 bg-line/50" aria-hidden="true" />
                <dd className="text-xs font-semibold tabular-nums text-ink">{Number(statsMap[key] || 0).toLocaleString("pt-BR")}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 border-t border-line/60 pt-4">
            {!currentUserId ? (
              <p className="text-sm text-mist">
                Abra um perfil para avaliar ou adicionar este livro a sua lista.
              </p>
            ) : (
              <div ref={readingActionsRef} className="relative">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={event => {
                      readingTriggerRef.current = event.currentTarget;
                      setActiveReadingMenu(current => current === "rating" ? null : "rating");
                    }}
                    aria-expanded={activeReadingMenu === "rating"}
                    aria-controls="book-reading-popover"
                    className="rounded-xl bg-gradient-to-r from-forest to-berry px-3 py-2.5 text-xs font-semibold text-white transition hover:brightness-110"
                  >
                    Avaliar
                  </button>
                  <button
                    type="button"
                    onClick={event => {
                      readingTriggerRef.current = event.currentTarget;
                      setActiveReadingMenu(current => current === "status" ? null : "status");
                    }}
                    aria-expanded={activeReadingMenu === "status"}
                    aria-controls="book-reading-popover"
                    className="rounded-xl border border-line bg-panelSoft px-3 py-2.5 text-xs font-semibold text-white transition hover:border-mist/50"
                  >
                    Adicionar
                  </button>
                </div>

                {activeReadingMenu && <div id="book-reading-popover" role="region" aria-label={activeReadingMenu === "rating" ? "Avaliar livro" : "Adicionar à lista"} className="absolute inset-x-0 top-full z-40 mt-2 rounded-2xl border border-line bg-panel p-3 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-white">{activeReadingMenu === "rating" ? "Avaliar livro" : "Adicionar à lista"}</p>
                    <button type="button" aria-label="Fechar opções" onClick={() => { setActiveReadingMenu(null); readingTriggerRef.current?.focus(); }} className="flex h-7 w-7 items-center justify-center rounded-lg text-mist hover:bg-panelSoft hover:text-white">×</button>
                  </div>
                {activeReadingMenu === "rating" && (
                  <form className="space-y-3" onSubmit={handleRatingSubmit}>
                    <StarRating
                      value={readingForm.nota}
                      onChange={(nota) => setReadingForm((current) => ({ ...current, nota }))}
                      disabled={savingReading}
                    />

                    <button
                      type="submit"
                      disabled={savingReading || readingForm.nota === ""}
                      className="w-full rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-white transition hover:bg-berry disabled:opacity-60"
                    >
                      {savingReading ? "Salvando..." : "Salvar nota"}
                    </button>
                  </form>
                )}

                {activeReadingMenu === "status" && (
                  <div className="grid gap-1.5">
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusSubmit(status)}
                        disabled={savingReading}
                        aria-pressed={savedStatus === status}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition enabled:hover:border-copper enabled:hover:bg-copper enabled:hover:text-midnight focus-visible:border-copper focus-visible:bg-copper focus-visible:text-midnight disabled:opacity-60 ${
                          savedStatus === status
                            ? "border-copper bg-copper text-midnight"
                            : "border-line bg-midnight/70 text-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                </div>}
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
            {data.livro.genero}
          </p>
          <h1 className="mt-3 font-display text-5xl">{data.livro.titulo}</h1>
          <p className="mt-2 text-lg text-mist">{data.livro.autor}</p>
          <div className="mt-5 grid gap-3 text-sm text-mist md:grid-cols-2">
            {data.livro.totalPaginas && (
              <span className="rounded-2xl bg-panelSoft px-4 py-3">
                Paginas: {data.livro.totalPaginas}
              </span>
            )}
            {data.livro.editora && (
              <span className="rounded-2xl bg-panelSoft px-4 py-3">
                Editora: {data.livro.editora}
              </span>
            )}
            {data.livro.anoPublicacao && (
              <span className="rounded-2xl bg-panelSoft px-4 py-3">
                Publicacao: {data.livro.anoPublicacao}
              </span>
            )}
            {data.livro.idioma && (
              <span className="rounded-2xl bg-panelSoft px-4 py-3">
                Idioma: {data.livro.idioma}
              </span>
            )}
            {data.livro.isbn && (
              <span className="rounded-2xl bg-panelSoft px-4 py-3 md:col-span-2">
                ISBN: {data.livro.isbn}
              </span>
            )}
          </div>
          <p className="mt-5 max-w-3xl text-justify text-sm leading-7 text-slate-300">{data.livro.descricao}</p>


        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-copper">Aba de fanart</p>
            <h2 className="font-display text-3xl">Fanarts deste livro</h2>
          </div>
          <span className="text-sm text-mist">{fanarts.length} fanarts</span>
        </div>

        <FanartComposer key={id} bookId={id} bookTitle={data.livro.titulo} onPublished={loadBookPage} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {fanarts.map((post) => (
            <article key={post._id} className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
              <div className="flex aspect-[3/4] items-center justify-center bg-panelSoft p-2">
                <img
                  src={post.urlImagem}
                  alt={post.texto || `Fanart de ${data.livro.titulo}`}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 text-xs leading-5 text-slate-300">{post.texto}</p>
                <p className="truncate text-xs text-mist">
                  por {post.usuario?.nome || "Usuario desconhecido"}
                </p>
              </div>
            </article>
          ))}
          {fanarts.length === 0 && (
            <p className="col-span-full rounded-3xl border border-dashed border-line bg-panelSoft p-5 text-sm text-mist">
              Ainda nao ha fanarts para este livro.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default BookPage;
