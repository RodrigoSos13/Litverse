import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
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
    </div>
  );
}

export default UserProfilePage;
