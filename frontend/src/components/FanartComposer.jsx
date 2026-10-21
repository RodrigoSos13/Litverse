import { useRef, useState } from "react";
import api from "../services/api";

const maxSize = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export default function FanartComposer({ bookId, bookTitle, onPublished }) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [success, setSuccess] = useState(false);
  const input = useRef(null);
  const selection = useRef(0);

  async function selectImage(file) {
    if (!file || busy) return;
    const version = ++selection.current;
    setError("");
    if (!allowedTypes.includes(file.type) || file.size > maxSize) {
      setError("Envie uma imagem JPG, PNG ou WebP de até 5 MB.");
      return;
    }
    try {
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
      if (version === selection.current) setImage({ data, name: file.name });
    } catch {
      if (version === selection.current) setError("Não foi possível abrir essa imagem. Tente outra.");
    }
  }

  function close() {
    selection.current++;
    setOpen(false);
    setImage(null);
    setCaption("");
    setError("");
  }

  async function publish(event) {
    event.preventDefault();
    if (!image || busy || !caption.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/posts", { livro: bookId, tipo: "fanart", texto: caption.trim(), urlImagem: image.data });
      close();
      setSuccess(true);
      try {
        await onPublished();
      } catch {
        setError("Sua fanart foi salva. Recarregue a página para atualizar a galeria.");
      }
    } catch {
      setError("Não foi possível publicar sua fanart. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-5">
      {success && <p role="status" className="mb-4 text-sm text-glow">Sua fanart foi publicada!</p>}
      {!open && error && <p role="alert" className="mb-4 text-sm text-red-300">{error}</p>}
      {!open ? (
        <button type="button" onClick={() => { setOpen(true); setSuccess(false); }} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-forest to-berry px-6 py-3 font-semibold text-white transition hover:brightness-110">
          <span aria-hidden="true" className="text-xl">+</span> Adicionar fanart
        </button>
      ) : (
        <form onSubmit={publish} className="rounded-3xl border border-line bg-panel p-5 shadow-card sm:p-6">
          <h3 className="font-display text-2xl text-white">Compartilhe sua arte</h3>
          <p className="mt-1 text-sm text-mist">Sua interpretação de {bookTitle} merece um lugar aqui.</p>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" tabIndex={-1} onChange={(event) => { selectImage(event.target.files?.[0]); event.target.value = ""; }} />
          <div className={`mt-5 rounded-2xl border-2 border-dashed p-4 transition ${dragging ? "border-copper bg-copper/10" : "border-line bg-panelSoft"}`} onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectImage(event.dataTransfer.files?.[0]); }}>
            {image ? (
              <div>
                <img src={image.data} alt="Prévia da fanart que será publicada" className="mx-auto max-h-80 rounded-xl object-contain" />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0 break-all text-sm text-mist">{image.name}</p>
                  <button type="button" disabled={busy} onClick={() => input.current.click()} className="rounded-full border border-line px-4 py-2 text-sm text-copper hover:border-copper disabled:opacity-50">Trocar imagem</button>
                </div>
              </div>
            ) : (
              <button type="button" disabled={busy} onClick={() => input.current.click()} className="flex w-full flex-col items-center rounded-xl px-3 py-8 text-center focus-visible:outline focus-visible:outline-copper">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 h-10 w-10 text-copper"><path d="M12 16V3m-4 4 4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></svg>
                <span className="font-semibold text-white">Envie sua imagem</span>
                <span className="mt-1 text-sm text-mist">Arraste aqui ou clique para selecionar</span>
                <span className="mt-3 text-xs text-mist">JPG, PNG ou WebP · até 5 MB</span>
              </button>
            )}
          </div>
          <label htmlFor="fanart-caption" className="mb-2 mt-5 block text-sm font-semibold text-mist">Legenda</label>
          <textarea id="fanart-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={1000} required disabled={busy} rows={3} placeholder="Conte o que inspirou sua arte…" className="w-full rounded-2xl border border-line bg-panelSoft px-4 py-3 text-sm focus:border-copper focus:outline-none" />
          <p className="mt-1 text-right text-xs text-mist">{caption.length}/1000</p>
          {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button type="button" disabled={busy} onClick={close} className="rounded-full border border-line px-5 py-3 text-sm text-mist disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={busy || !image || !caption.trim()} className="rounded-full bg-gradient-to-r from-forest to-berry px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Adicionando…" : "Adicionar fanart"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
