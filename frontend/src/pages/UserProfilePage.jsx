import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import PostCard from "../components/PostCard";

function ReadingSection({ title, items }) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-5 shadow-card">
      <h3 className="font-display text-2xl">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((reading) => (
          <div key={reading._id} className="rounded-2xl bg-panelSoft p-3">
            <p className="font-semibold">{reading.livro?.titulo}</p>
            <p className="text-sm text-mist">{reading.livro?.autor}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-copper">
              Nota {reading.nota ?? "-"}
            </p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-mist">Nenhum livro nesta lista ainda.</p>}
      </div>
    </section>
  );
}

function UserProfilePage() {
  const { id } = useParams();
  const { currentUserId } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
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

  function loadProfile() {
    return api.get(`/users/${id}/profile`).then((response) => setProfile(response.data));
  }

  useEffect(() => {
    loadProfile().catch(console.error);
  }, [id]);

  if (!profile) {
    return <p>Carregando perfil...</p>;
  }

  const { usuario, leituras, posts } = profile;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-line bg-panel p-8 shadow-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <img
              src={usuario.urlAvatar || "https://placehold.co/160x160"}
              alt={usuario.nome}
              className="h-28 w-28 rounded-full object-cover"
            />
            <div>
              <h1 className="font-display text-4xl">{usuario.nome}</h1>
              <p className="text-mist">@{usuario.usuario}</p>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">{usuario.biografia}</p>
              <div className="mt-4 flex gap-6 text-sm font-semibold text-glow">
                <span>{usuario.totalSeguidores} seguidores</span>
                <span>{usuario.totalSeguindo} seguindo</span>
              </div>
            </div>
          </div>


        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ReadingSection title="Quero ler" items={leituras.quero_ler} />
        <ReadingSection title="Lendo" items={leituras.lendo} />
        <ReadingSection title="Lidos" items={leituras.lido} />
      </section>

      <section>
        <h2 className="mb-4 font-display text-3xl">Posts do usuario</h2>
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
