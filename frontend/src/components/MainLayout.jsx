import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

function MainLayout() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem("litverse:user"));
  const location = useLocation();
  const navigate = useNavigate();

  function loadUsers() {
    return api.get("/users").then((response) => {
      setUsers(response.data);

      if (!currentUserId && response.data[0]?._id) {
        setCurrentUserId(response.data[0]._id);
      }

      return response.data;
    });
  }

  useEffect(() => {
    loadUsers().catch(console.error);
  }, []);

  useEffect(() => {
    if (users.length > 0 && !users.some((user) => user._id === currentUserId)) {
      setCurrentUserId(users[0]._id);
    }
  }, [users, currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem("litverse:user", currentUserId);
    } else {
      localStorage.removeItem("litverse:user");
    }
  }, [currentUserId]);

  function handleSearchChange(event) {
    const nextValue = event.target.value;
    setSearch(nextValue);

    if (location.pathname !== "/") {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b1324_0%,#09111f_55%,#070d18_100%)] text-ink">
      <header className="border-b border-line/80 bg-midnight/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <NavLink to="/" className="font-display text-3xl font-bold text-white drop-shadow-[0_2px_18px_rgba(255,227,199,0.25)]">
              LitVerse
            </NavLink>
            <div className="flex items-center gap-2 lg:hidden">
              <NavLink
                to="/create-book"
                className="inline-flex rounded-full bg-gradient-to-r from-forest to-berry px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Cadastrar livro
              </NavLink>
              <NavLink
                to={currentUserId ? `/users/${currentUserId}` : "/"}
                className="inline-flex rounded-full border border-line bg-panel px-4 py-2 text-sm font-semibold text-white transition hover:border-copper hover:text-glow"
              >
                Perfil
              </NavLink>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:max-w-3xl lg:flex-row lg:items-center lg:justify-end">
            <label className="w-full lg:max-w-xl" htmlFor="header-book-search">
              <span className="sr-only">Pesquisar livros</span>
              <input
                id="header-book-search"
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Pesquisar livros por titulo ou autor"
                className="w-full rounded-full border border-line bg-panel px-5 py-3 text-sm text-white outline-none transition placeholder:text-mist focus:border-forest"
              />
            </label>
            <NavLink
              to="/create-book"
              className="hidden rounded-full bg-gradient-to-r from-forest to-berry px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 lg:inline-flex"
            >
              Cadastrar livro
            </NavLink>
            <NavLink
              to={currentUserId ? `/users/${currentUserId}` : "/"}
              className="hidden rounded-full border border-line bg-panel px-5 py-3 text-sm font-semibold text-white transition hover:border-copper hover:text-glow lg:inline-flex"
            >
              Perfil
            </NavLink>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet
          context={{
            currentUserId,
            search,
            users,
            setCurrentUserId,
            refreshUsers: loadUsers,
          }}
        />
      </main>
    </div>
  );
}

export default MainLayout;
