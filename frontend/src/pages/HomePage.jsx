import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../services/api";
import BookCard from "../components/BookCard";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";

function HomePage() {
  const [books, setBooks] = useState([]);
  const [posts, setPosts] = useState([]);
  const { currentUserId, search } = useOutletContext();

  useEffect(() => {
    loadData().catch(console.error);
  }, [search]);

  async function loadData() {
    const [bookResponse, recentPosts] = await Promise.all([
      api.get("/books", { params: search ? { search } : { featured: true } }),
      api.get("/posts"),
    ]);

    setBooks(bookResponse.data);
    setPosts(recentPosts.data);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="space-y-6">
        <Sidebar currentUserId={currentUserId} />
      </div>

      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[2rem] border border-line bg-[radial-gradient(circle_at_top_left,rgba(197,59,76,0.26),transparent_30%),linear-gradient(135deg,#1a2740_0%,#111a2d_60%,#0b1324_100%)] p-8 text-white shadow-card">
            <p className="text-sm uppercase tracking-[0.25em] text-copper">Pagina inicial</p>
            <h1 className="mt-3 font-display text-4xl">Converse sobre livros como se fossem mundos que voce pode visitar.</h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300">
              Descubra livros em destaque, publique resenhas, compartilhe fanarts e deixe sua jornada de leitura visivel.
            </p>
          </div>
          <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-card">
            <p className="text-sm uppercase tracking-[0.22em] text-copper">Acesso rapido</p>
            <h2 className="mt-3 font-display text-3xl text-white">
              {search ? "Explorando livros encontrados" : "Comece pela busca no cabecalho"}
            </h2>
            <p className="mt-4 text-sm text-white">
              Use o campo de busca no cabecalho para encontrar titulos e autores de qualquer parte do app.
            </p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-3xl text-white">
              {search ? "Resultados da busca" : "Livros em destaque"}
            </h2>
            <span className="text-sm text-mist">{books.length} resultados</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-display text-3xl text-white">Posts recentes</h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={currentUserId}
                onRefresh={loadData}
              />
            ))}
            {posts.length === 0 && <p className="text-sm text-mist">Ainda nao ha posts.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
