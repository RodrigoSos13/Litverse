import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import api from "../services/api";
import BookCover from "../components/BookCover";
import StarRating from "../components/StarRating";
import FanartComposer from "../components/FanartComposer";

const initialReadingForm = {
  status: "quero_ler",
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
  const [savingReading, setSavingReading] = useState(false);
  const [activeReadingMenu, setActiveReadingMenu] = useState(null);

  function loadBookPage() {
    return api.get(`/books/${id}`).then((response) => setData(response.data));
  }

  useEffect(() => {
    loadBookPage().catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!currentUserId) {
      setReadingForm(initialReadingForm);
      return;
    }

    api
      .get("/readings", {
        params: {
          user: currentUserId,
          book: id,
        },
      })
      .then((response) => {
        const reading = response.data[0];

        setReadingForm({
          status: reading?.status || "quero_ler",
          nota: reading?.nota ?? "",
        });
      })
      .catch(console.error);
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
          <div className="flex h-96 items-center justify-center rounded-3xl bg-panelSoft p-4">
            <BookCover url={data.livro.urlCapa} title={data.livro.titulo} className="h-full w-full rounded-2xl object-contain" />
          </div>

          <div className="mt-4 space-y-3 rounded-3xl border border-line bg-panelSoft p-4 text-sm text-mist">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-copper">Nota</p>
              <p className="mt-1 font-display text-3xl text-white">
                {data.livro.mediaAvaliacoes || 0}/5
              </p>
              <p>{data.livro.totalAvaliacoes || 0} avaliacoes</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-2xl bg-midnight/70 px-3 py-2">
                {statsMap.lido || 0} lidos
              </span>
              <span className="rounded-2xl bg-midnight/70 px-3 py-2">
                {statsMap.lendo || 0} lendo
              </span>
              <span className="rounded-2xl bg-midnight/70 px-3 py-2">
                {statsMap.quero_ler || 0} querem ler
              </span>
            </div>
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
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300">{data.livro.descricao}</p>

          <div className="mt-6">
            {!currentUserId ? (
              <p className="text-sm text-mist">
                Abra um perfil para avaliar ou adicionar este livro a sua lista.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveReadingMenu((current) => (current === "rating" ? null : "rating"))
                    }
                    className="rounded-full bg-gradient-to-r from-forest to-berry px-6 py-3 font-semibold text-white transition hover:brightness-110"
                  >
                    Avaliar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveReadingMenu((current) => (current === "status" ? null : "status"))
                    }
                    className="rounded-full bg-gradient-to-r from-forest to-berry px-6 py-3 font-semibold text-white transition hover:brightness-110"
                  >
                    Adicionar
                  </button>
                </div>

                {activeReadingMenu === "rating" && (
                  <form className="flex flex-wrap items-end gap-3" onSubmit={handleRatingSubmit}>
                    <StarRating
                      value={readingForm.nota}
                      onChange={(nota) => setReadingForm((current) => ({ ...current, nota }))}
                      disabled={savingReading}
                    />

                    <button
                      type="submit"
                      disabled={savingReading || readingForm.nota === ""}
                      className="rounded-full bg-copper px-6 py-3 font-semibold text-midnight transition hover:brightness-110 disabled:opacity-60"
                    >
                      {savingReading ? "Salvando..." : "Salvar nota"}
                    </button>
                  </form>
                )}

                {activeReadingMenu === "status" && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusSubmit(status)}
                        disabled={savingReading}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                          readingForm.status === status
                            ? "border-copper bg-copper text-midnight"
                            : "border-line bg-midnight/70 text-white hover:border-copper"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
