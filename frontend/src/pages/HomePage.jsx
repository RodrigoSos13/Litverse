import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../services/api";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";
import GoogleBooksSearch from "../components/GoogleBooksSearch";

function HomePage() {
  const [catalog, setCatalog] = useState({ term: null, books: [], error: "", loading: true });
  const [posts, setPosts] = useState([]);
  const { currentUserId, search } = useOutletContext();
  const term = search.trim();
  const requestId = useRef(0);
  const current = catalog.term === term ? catalog : { term, books: [], error: "", loading: true };

  useEffect(() => {
    const controller = new AbortController();
    setCatalog({ term, books: [], error: "", loading: true });
    const timer = setTimeout(() => loadCatalog(controller.signal, term), 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [term]);

  useEffect(() => {
    const controller = new AbortController();
    loadPosts(controller.signal);
    return () => controller.abort();
  }, []);

  async function loadCatalog(signal, searchedTerm = term) {
    const id = ++requestId.current;
    setCatalog({ term: searchedTerm, books: [], error: "", loading: true });
    try {
      const response = await api.get("/books", { params: searchedTerm ? { search: searchedTerm } : {}, signal });
      if (!signal?.aborted && id === requestId.current) setCatalog({ term: searchedTerm, books: response.data, error: "", loading: false });
    } catch (err) {
      if (!signal?.aborted && id === requestId.current) setCatalog({ term: searchedTerm, books: [], error: "Não foi possível carregar o catálogo. Tente novamente.", loading: false });
    }
  }

  async function loadPosts(signal) {
    try {
      const response = await api.get("/posts", { signal });
      if (!signal?.aborted) setPosts(response.data);
    } catch (err) { if (!signal?.aborted) console.error("Não foi possível carregar os posts."); }
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

        <GoogleBooksSearch query={search} localBooks={current.books} localQuery={current.term} localLoading={current.loading} localError={current.error} onRetryLocal={() => loadCatalog()} />

        <section className="mx-auto w-full max-w-[560px]">
          <h2 className="mb-4 font-display text-3xl text-white">Posts recentes</h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={currentUserId}
                onRefresh={() => loadPosts()}
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
