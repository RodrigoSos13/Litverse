import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import PostCard from "./PostCard";
import FollowButton from "./FollowButton";

export default function CommunityPeople({ currentUserId, onSearchChange }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInput = useRef(null);
  const searchToggle = useRef(null);
  useEffect(() => { if (searchOpen) searchInput.current?.focus(); }, [searchOpen]);
  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    onSearchChange(false);
    searchToggle.current?.focus();
  }
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    if (!query.trim()) { setUsers([]); setPosts([]); setLoading(false); setError(false); return () => controller.abort(); }
    setLoading(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const [people, publications] = await Promise.all([
          api.get("/users", { params: { q: query.trim() }, signal: controller.signal }),
          api.get("/posts", { params: { q: query.trim() }, signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) { setUsers(people.data); setPosts(publications.data); }
      } catch { if (!controller.signal.aborted) setError(true); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, version]);
  return <section aria-labelledby="community-people-title" className="mb-8">
    <div className="flex items-center gap-3">
      <h3 id="community-people-title" className="font-display text-2xl text-white">Pesquisar na comunidade</h3>
      <button ref={searchToggle} type="button" aria-label={searchOpen ? "Fechar pesquisa na comunidade" : "Abrir pesquisa na comunidade"} aria-expanded={searchOpen} aria-controls="community-search-fields" onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-copper transition hover:bg-copper/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
      </button>
    </div>
    <div id="community-search-fields" hidden={!searchOpen} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); closeSearch(); } }}>
      <label htmlFor="people-search" className="mt-4 block text-sm text-mist">Buscar usuários ou publicações</label>
      <input ref={searchInput} id="people-search" type="search" maxLength={100} value={query} onChange={event => { setQuery(event.target.value); onSearchChange(Boolean(event.target.value.trim())); }} placeholder="Nome, @usuário ou texto de uma publicação" className="mt-2 w-full rounded-xl border border-line bg-midnight px-4 py-3 text-ink outline-none focus:border-copper" />
    </div>
    {query.trim() && <div className="mt-4" aria-live="polite" aria-busy={loading}>
      {loading ? <p role="status" className="text-sm text-mist">Buscando…</p> : error ? <p role="alert" className="text-sm text-mist">Não foi possível pesquisar. <button type="button" onClick={() => setVersion(value => value + 1)} className="text-copper underline">Tentar novamente</button></p> : users.length === 0 && posts.length === 0 ? <p className="text-sm text-mist">Nenhum usuário ou publicação encontrado.</p> : <>{users.length > 0 && <h4 className="mb-3 text-sm font-semibold text-mist">Usuários</h4>}<ul className="grid gap-3 md:grid-cols-2">
        {users.map(user => <li key={user._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3">
          <Link to={`/users/${user._id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-copper">
            {user.urlAvatar ? <img src={user.urlAvatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest/25 text-glow">{user.nome?.slice(0, 1).toUpperCase()}</span>}
            <span className="min-w-0"><span className="block truncate font-semibold text-white">{user.nome}</span><span className="block truncate text-sm text-mist">@{user.usuario}</span></span>
          </Link>
          <FollowButton user={user} onChanged={data => setUsers(current => current.map(item => item._id === user._id ? { ...item, ...data } : item))} />
        </li>)}
      </ul>
      {posts.length > 0 && <><h4 className="mb-3 mt-6 text-sm font-semibold text-mist">Publicações</h4><div className="columns-1 gap-5 lg:columns-2">{posts.map(post => <div key={post._id} className="mb-5 break-inside-avoid-column"><PostCard post={post} currentUserId={currentUserId} fullWidth onDeleted={id => setPosts(current => current.filter(item => item._id !== id))} /></div>)}</div></>}
      </>}
    </div>}
  </section>;
}
