import { NavLink } from "react-router-dom";

function Sidebar({ currentUserId }) {
  const linkClass =
    "block rounded-2xl border border-line bg-panel px-4 py-3 text-sm font-semibold text-ink transition hover:border-forest hover:bg-panelSoft hover:text-glow";

  return (
    <aside className="space-y-3">
      <NavLink className={linkClass} to="/?tab=comunidade&compose=1">
        Adicionar post
      </NavLink>
      {!currentUserId && (
        <p className="rounded-2xl border border-dashed border-line bg-panelSoft/80 px-4 py-3 text-sm text-mist">
          Crie um usuario primeiro para abrir um perfil e interagir com os posts.
        </p>
      )}
    </aside>
  );
}

export default Sidebar;
