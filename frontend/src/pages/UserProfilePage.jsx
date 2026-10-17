import { useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import useUserProfile, { readingTabs } from "../hooks/useUserProfile";
import EditProfileDialog from "../components/EditProfileDialog";
import PostCard from "../components/PostCard";

function UserProfilePage() {
  const { id } = useParams();
  const { currentUserId } = useOutletContext();
  const { profile, error, refresh: loadProfile } = useUserProfile(id);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Não foi possível sair. Tente novamente.");
    } finally {
      setLoggingOut(false);
    }
  }

  if (error) return <div role="alert" className="py-16 text-center"><p className="text-mist">{error}</p><button onClick={loadProfile} className="mt-4 text-copper">Tentar novamente</button></div>;
  if (!profile) return <p role="status" className="py-16 text-center text-mist">Carregando perfil…</p>;

  const { usuario, leituras, posts } = profile;

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-8">
      {editing && id === currentUserId && <EditProfileDialog key={id} user={usuario} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); loadProfile(); }} />}
      <section aria-label="Perfil" className="border-b border-line pb-8 pt-4 sm:pt-8">
        <div className="flex items-start gap-5 sm:gap-8">
          {usuario.urlAvatar ? <img src={usuario.urlAvatar} alt={usuario.nome} className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-white/5 sm:h-28 sm:w-28" /> : <div aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-forest/25 font-display text-3xl text-glow ring-4 ring-white/5 sm:h-28 sm:w-28">{usuario.nome?.slice(0, 1).toUpperCase()}</div>}
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-copper">{id === currentUserId ? "Meu espaço literário" : "Espaço literário"}</p>
            <h1 className="break-words font-display text-3xl text-white sm:text-4xl">{usuario.nome}</h1>
            <p className="mt-1 text-sm text-mist">@{usuario.usuario}</p>
            {usuario.biografia && <p className="mt-4 max-w-xl whitespace-pre-line text-sm leading-relaxed text-slate-300">{usuario.biografia}</p>}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-mist">
              <span><strong className="font-semibold text-ink">{usuario.totalSeguidores || 0}</strong> seguidores</span>
              <span><strong className="font-semibold text-ink">{usuario.totalSeguindo || 0}</strong> seguindo</span>
            </div>
          </div>
          {id === currentUserId && <button type="button" onClick={() => setEditing(true)} aria-label="Editar meu perfil" title="Editar perfil" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-mist transition hover:border-copper/50 hover:bg-panelSoft hover:text-copper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 3 5 5M4 20l5-1L21 7a2.1 2.1 0 0 0-5-5L4 14l-1 7 6-2" /></svg></button>}
        </div>
        <div className="mt-8 flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Biblioteca</h2><span className="text-xs text-mist">Explore as leituras →</span></div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-line">
          {readingTabs.map(tab => <Link key={tab.key} to={`/users/${id}/library?status=${tab.key}`} className="group py-4 text-center transition hover:bg-white/[0.03]">
            <span className="block text-3xl font-semibold tabular-nums text-white transition group-hover:text-copper">{leituras[tab.key]?.length || 0}</span>
            <span className="mt-1 block text-sm text-mist group-hover:text-ink">{tab.label}</span>
          </Link>)}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[560px]">
        <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-2xl">Publicações</h2><span className="text-sm tabular-nums text-mist">{posts.length}</span></div>
        {posts.length === 0 && <p className="py-10 text-center text-sm text-mist">As próximas histórias compartilhadas aparecerão aqui.</p>}
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              onRefresh={loadProfile}
            />
          ))}
        </div>
      </section>
      {id === currentUserId && (
        <div className="border-t border-line pt-6">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-red-400 transition hover:bg-red-400/10 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 disabled:opacity-50"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {loggingOut ? "Saindo…" : "Sair"}
          </button>
          {logoutError && <p role="alert" className="mt-2 text-sm text-red-300">{logoutError}</p>}
        </div>
      )}
    </div>
  );
}

export default UserProfilePage;
