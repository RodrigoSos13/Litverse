import { useEffect, useRef, useState } from "react";
import AvatarCropper from "./AvatarCropper";
import { useAuth } from "../contexts/AuthContext";

export default function EditProfileDialog({ user, onClose, onSaved }) {
  const dialog = useRef(null);
  const { updateProfile } = useAuth();
  const [values, setValues] = useState({ nome: user.nome, biografia: user.biografia || "", urlAvatar: user.urlAvatar || "" });
  const [cropImage, setCropImage] = useState(null);
  useEffect(() => () => { if (cropImage) URL.revokeObjectURL(cropImage.src); }, [cropImage]);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { dialog.current.showModal(); }, []);
  useEffect(() => { setImageFailed(false); }, [values.urlAvatar]);

  async function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Escolha uma imagem JPG, PNG ou WebP de até 5 MB.");
      return;
    }
    setProcessing(true);
    const source = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      setCropImage(image);
    } catch { URL.revokeObjectURL(source); setError("Não foi possível abrir essa imagem. Escolha outra foto."); }
    finally { setProcessing(false); }
  }
  async function save(event) {
    event.preventDefault();
    if (cropImage || processing) return;
    setBusy(true);
    setError("");
    try {
      await updateProfile({ ...values, nome: values.nome.trim() });
      onSaved();
    } catch (err) { setError(err.response?.data?.message || "Não foi possível salvar o perfil. Tente novamente."); }
    finally { setBusy(false); }
  }
  const inputClass = "mt-2 w-full rounded-xl border border-line bg-midnight/60 px-4 py-3 text-sm text-white outline-none focus:border-copper focus:ring-2 focus:ring-copper/15";
  return (
    <dialog ref={dialog} aria-labelledby="edit-profile-title" onCancel={event => { event.preventDefault(); if (!busy && !processing) onClose(); }} onClick={event => { if (event.target === event.currentTarget && !busy && !processing) onClose(); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-line bg-panel p-0 text-ink shadow-card backdrop:bg-black/70 backdrop:backdrop-blur-sm">
      <form onSubmit={save} className="p-6 sm:p-8">
        <div className="mb-7 flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-copper">Seu espaço literário</p><h2 id="edit-profile-title" className="mt-2 font-display text-2xl text-white">Editar perfil</h2></div><button type="button" aria-label="Fechar edição" disabled={busy || processing} onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-mist hover:bg-panelSoft">×</button></div>
        <fieldset disabled={busy || processing} className="space-y-5 disabled:opacity-60">
          <div className="flex items-center gap-5">
            {values.urlAvatar && !imageFailed ? <img src={values.urlAvatar} onError={() => setImageFailed(true)} alt="Prévia da foto de perfil" className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-white/5" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-forest/25 font-display text-3xl text-glow">{values.nome.trim().slice(0, 1).toUpperCase() || "L"}</div>}
            <div><label className="relative inline-flex cursor-pointer rounded-lg border border-line bg-panelSoft px-3 py-2 text-xs font-semibold text-white hover:border-mist/50 focus-within:ring-2 focus-within:ring-copper">{processing ? "Preparando…" : "Alterar foto"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} className="absolute inset-0 w-full cursor-pointer opacity-0" aria-label="Escolher foto de perfil" /></label><p className="mt-2 text-[11px] text-mist">JPG, PNG ou WebP · até 5 MB</p>{values.urlAvatar && <button type="button" onClick={() => { setValues(current => ({ ...current, urlAvatar: "" })); setCropImage(null); }} className="mt-2 text-xs text-mist hover:text-red-300">Remover foto</button>}</div>
          </div>
          {cropImage && <AvatarCropper key={cropImage.src} image={cropImage} onCancel={() => setCropImage(null)} onApply={urlAvatar => { setValues(current => ({ ...current, urlAvatar })); setCropImage(null); }} />}
          <label className="block text-sm font-medium">Nome<input required maxLength={100} value={values.nome} onChange={event => setValues(current => ({ ...current, nome: event.target.value }))} className={inputClass} autoComplete="name" /></label>
          <label className="block text-sm font-medium">Bio<textarea maxLength={280} rows={4} value={values.biografia} onChange={event => setValues(current => ({ ...current, biografia: event.target.value }))} placeholder="Conte um pouco sobre você e suas leituras…" className={`${inputClass} resize-none`} /><span className="mt-1 block text-right text-[11px] font-normal tabular-nums text-mist">{values.biografia.length}/280</span></label>
        </fieldset>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <div className="mt-6 flex justify-end gap-3 border-t border-line pt-5"><button type="button" disabled={busy || processing} onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm text-mist hover:text-white disabled:opacity-60">Cancelar</button><button type="submit" disabled={busy || processing || !!cropImage || !values.nome.trim()} className="rounded-xl bg-gradient-to-r from-forest to-berry px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60">{busy ? "Salvando…" : "Salvar alterações"}</button></div>
      </form>
    </dialog>
  );
}
