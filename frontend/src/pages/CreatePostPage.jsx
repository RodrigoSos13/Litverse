import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../services/api";
import SearchBar from "../components/SearchBar";
import BookCover from "../components/BookCover";

const postTypes = [
  { value: "opiniao", label: "Pensamento", symbol: "✦", hint: "Uma ideia, uma descoberta ou aquela leitura que não sai da cabeça.", placeholder: "O que a sua última leitura despertou em você?" },
  { value: "resenha", label: "Resenha", symbol: "≡", hint: "Conte sua experiência com uma leitura e abra espaço para a conversa.", placeholder: "O que você achou do livro? Compartilhe suas impressões…" },
  { value: "citacao", label: "Citação", symbol: "“", hint: "Dê um novo lugar àquelas palavras que ficaram com você.", placeholder: "Compartilhe um trecho marcante e lembre de citar a autoria…" },
];

export default function CreatePostPage() {
  const [tipo, setTipo] = useState("opiniao");
  const [texto, setTexto] = useState("");
  const [livro, setLivro] = useState(null);
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState("");
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef(null);
  const selection = useRef(0);
  const { currentUserId } = useOutletContext();
  const navigate = useNavigate();
  const selectedType = postTypes.find(type => type.value === tipo);

  useEffect(() => {
    return () => { selection.current++; };
  }, []);

  async function selectImages(files) {
    if (!files?.length || busy || reading) return;
    const batch = Array.from(files);
    setImageError("");
    if (images.length + batch.length > 4) {
      setImageError("Você pode adicionar até 4 fotos.");
      return;
    }
    if (batch.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setImageError("Selecione imagens JPG, PNG ou WebP de até 5 MB cada.");
      return;
    }
    if (images.reduce((total, image) => total + image.size, 0) + batch.reduce((total, file) => total + file.size, 0) > 10 * 1024 * 1024) {
      setImageError("As fotos juntas devem ter até 10 MB.");
      return;
    }
    const version = ++selection.current;
    setReading(true);
    try {
      const added = await Promise.all(batch.map(async file => {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await new Promise((resolve, reject) => {
          const preview = new Image();
          preview.onload = resolve;
          preview.onerror = reject;
          preview.src = data;
        });
        return { data, name: file.name, size: file.size };
      }));
      if (version === selection.current) setImages(current => [...current, ...added]);
    } catch {
      if (version === selection.current) setImageError("Não foi possível abrir uma das imagens. Tente outros arquivos.");
    } finally {
      if (version === selection.current) setReading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!currentUserId || busy || reading || !texto.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/posts", { tipo, texto: texto.trim(), livro: livro?._id || null, usuario: currentUserId, imagens: images.map(image => image.data) }, { timeout: 30000 });
      navigate("/");
    } catch (failure) {
      setError(failure.response?.data?.message || "Não foi possível publicar. Seu texto e sua imagem foram mantidos para tentar novamente.");
    } finally { setBusy(false); }
  }

  return (
    <section className="mx-auto max-w-3xl pb-6">
      <header className="mb-7 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">Entre leitores</p>
        <h1 className="mt-3 font-display text-3xl text-ink sm:text-4xl">Toda leitura rende uma conversa.</h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">Compartilhe o que ficou com você e encontre novas perspectivas.</p>
      </header>

      <form onSubmit={handleSubmit} aria-busy={busy} className="rounded-3xl border border-line bg-panel shadow-card">
        <fieldset disabled={busy} className="min-w-0 p-5 sm:p-8">
          <legend className="sr-only">Criar publicação</legend>
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-ink">O que você quer compartilhar?</legend>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {postTypes.map(type => (
                <label key={type.value} className="relative cursor-pointer">
                  <input type="radio" name="tipo" value={type.value} checked={tipo === type.value} onChange={() => setTipo(type.value)} className="peer sr-only" />
                  <span className="flex items-center justify-center gap-2 rounded-xl border border-line bg-midnight/30 px-2 py-3 text-sm text-mist transition hover:border-copper/50 peer-checked:border-copper/70 peer-checked:bg-copper/10 peer-checked:text-copper peer-focus-visible:ring-2 peer-focus-visible:ring-copper">
                    <span aria-hidden="true" className="text-lg leading-none">{type.symbol}</span>{type.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 min-h-10 text-xs leading-5 text-mist sm:min-h-0">{selectedType.hint}</p>
          </fieldset>

          <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-midnight/30 focus-within:border-copper/60 focus-within:ring-2 focus-within:ring-copper/10">
            <label htmlFor="texto" className="sr-only">Texto da publicação</label>
            <textarea id="texto" value={texto} onChange={event => setTexto(event.target.value)} required maxLength={1000} rows={7} placeholder={selectedType.placeholder} className="block w-full resize-y border-0 bg-transparent p-5 text-base leading-7 text-ink outline-none placeholder:text-mist/60 sm:p-6" />
            <div className="flex items-center justify-between gap-3 px-5 pb-4 text-xs text-mist/70">
              <span>Seu espaço para falar de livros.</span><span className="shrink-0 tabular-nums">{texto.length}/1000</span>
            </div>
          </div>

          <div className={`mt-3 rounded-xl transition ${dragging ? "bg-copper/10 ring-1 ring-copper" : ""}`} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); selectImages(event.dataTransfer.files); }}>
            <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" tabIndex={-1} onChange={event => { selectImages(event.target.files); event.target.value = ""; }} />
            {images.length > 0 && <div className={`mb-3 grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {images.map((image, index) => <div key={`${index}-${image.name}`} className="relative overflow-hidden rounded-xl border border-line bg-midnight">
                <img src={image.data} alt={`Foto ${index + 1}: ${image.name}`} className="h-36 w-full object-cover sm:h-44" />
                <button type="button" disabled={reading} aria-label={`Remover foto ${index + 1}`} onClick={() => { setImages(current => current.filter((_, position) => position !== index)); setImageError(""); }} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-midnight/80 text-lg text-white hover:bg-midnight disabled:opacity-50">×</button>
              </div>)}
            </div>}
            <div className="flex items-center gap-3">
              <button type="button" disabled={reading || images.length >= 4} onClick={() => input.current?.click()} aria-describedby="image-help" className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-copper transition hover:bg-copper/10 disabled:opacity-40">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-6 5 7" /></svg>
                {reading ? "Preparando…" : "Adicionar fotos"}
              </button>
              <span id="image-help" className="text-xs text-mist/60">{images.length ? `${images.length}/4 fotos` : "Até 4 fotos"}</span>
            </div>
            {imageError && <p role="alert" className="mt-2 text-sm text-red-300">{imageError}</p>}
            {reading && <span role="status" className="sr-only">Preparando imagens</span>}
          </div>

          <div className="mt-6">
            <label htmlFor="livro" className="mb-2 block text-sm font-semibold text-ink">Livro relacionado <span className="ml-1 font-normal text-mist/60">(opcional)</span></label>
            {livro ? (
              <div className="flex items-center gap-3 rounded-xl border border-copper/30 bg-copper/5 p-3">
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-midnight"><BookCover url={livro.urlCapa} title={livro.titulo} /></div>
                <div className="min-w-0 flex-1"><p className="truncate font-display text-base text-ink">{livro.titulo}</p><p className="mt-1 truncate text-xs text-mist">{livro.autor}</p></div>
                <button id="livro" type="button" onClick={() => setLivro(null)} aria-label={`Remover vínculo com ${livro.titulo}`} className="rounded-lg px-3 py-2 text-xs text-mist hover:text-ink">Remover</button>
              </div>
            ) : <SearchBar placement="top" inputId="livro" onSelect={setLivro} disabled={busy} className="relative w-full" />}
            <p className="mt-2 text-xs text-mist/70">{livro ? "Este livro será vinculado à sua publicação." : "Pesquise e selecione um livro para vincular à publicação."}</p>
          </div>
        </fieldset>
        <footer className="rounded-b-3xl flex flex-wrap items-center justify-between gap-4 border-t border-line bg-midnight/20 px-5 py-5 sm:px-8">
          <p className="text-xs text-mist">{currentUserId ? "Uma boa conversa começa com você." : "Entre na sua conta para publicar."}</p>
          <button type="submit" disabled={!currentUserId || !texto.trim() || reading || busy} className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-berry disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Publicando…" : "Publicar"}<span aria-hidden="true">↗</span></button>
          {error && <p role="alert" className="w-full text-sm text-red-300">{error}</p>}
        </footer>
      </form>
    </section>
  );
}
