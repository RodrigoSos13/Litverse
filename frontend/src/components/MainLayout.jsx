import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useAuth } from "../contexts/AuthContext";

function MainLayout() {
  const [search, setSearch] = useState("");
  const [homeVisit, setHomeVisit] = useState(0);
  const { user } = useAuth();
  const currentUserId = user._id;
  const location = useLocation();
  const navigate = useNavigate();

  function handleSearchSubmit(nextValue) {
    setSearch(nextValue);

    if (location.pathname !== "/") {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b1324_0%,#09111f_55%,#070d18_100%)] text-ink">
      <header className="relative z-30 border-b border-white/10 bg-midnight/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4 px-4 py-4 sm:gap-x-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-10 lg:py-5">
          <NavLink to="/" aria-label="LitVerse — página inicial" onClick={event => {
            if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            setSearch("");
            setHomeVisit(visit => visit + 1);
            window.scrollTo({ top: 0, behavior: "instant" });
          }} className="rounded-sm font-display text-2xl font-bold tracking-tight text-white outline-none focus-visible:ring-2 focus-visible:ring-copper sm:text-3xl">
            LitVerse
          </NavLink>

          <SearchBar key={homeVisit} value={search} onSubmit={handleSearchSubmit} />

          <div className="col-start-2 row-start-1 flex items-center justify-end gap-3 lg:col-start-3 lg:gap-5">
            <NavLink
              to="/create-book"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-forest px-3 text-sm font-semibold text-white outline-none transition hover:bg-berry focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-midnight sm:px-4"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="hidden h-4 w-4 sm:block">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Adicionar livro
            </NavLink>
            <NavLink
              to={currentUserId ? `/users/${currentUserId}` : "/"}
              aria-label={`Perfil de @${user.usuario}`}
              title="Perfil"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-mist outline-none transition hover:text-white focus-visible:ring-2 focus-visible:ring-copper"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
              </svg>
            </NavLink>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet
          key={homeVisit}
          context={{
            currentUserId,
            search,
            currentUser: user,
          }}
        />
      </main>
    </div>
  );
}

export default MainLayout;
