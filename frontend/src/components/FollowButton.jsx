import { useState } from "react";
import api from "../services/api";

export default function FollowButton({ user, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const label = user.seguindo ? "Deixar de seguir" : user.segueVoce ? "Seguir de volta" : "Seguir";
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const { data } = await api[user.seguindo ? "delete" : "put"](`/users/${user._id}/follow`);
      onChanged(data);
    } catch { setError("Não foi possível atualizar. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <div className="shrink-0">
    <button type="button" disabled={busy} onClick={toggle} aria-label={`${label} @${user.usuario}`} className="min-h-10 rounded-xl border border-copper/40 px-4 py-2 text-sm font-semibold text-copper transition hover:bg-copper/10 disabled:opacity-50">{busy ? "Aguarde…" : label}</button>
    {error && <p role="alert" className="mt-2 max-w-48 text-xs text-red-300">{error}</p>}
  </div>;
}
