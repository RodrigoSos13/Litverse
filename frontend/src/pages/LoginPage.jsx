import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { user, loading, authenticate } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ identificador: "", nome: "", usuario: "", email: "", senha: "", confirmacao: "" });
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const registering = mode === "register";
  const destination = location.state?.from;
  if (user) return <Navigate to={destination ? `${destination.pathname}${destination.search || ""}${destination.hash || ""}` : "/"} replace />;
  function change(event) { setValues(current => ({ ...current, [event.target.name]: event.target.value })); setError(""); }
  async function submit(event) {
    event.preventDefault();
    if (registering && values.senha !== values.confirmacao) { setError("As senhas não coincidem. Confira e tente novamente."); return; }
    setBusy(true); setError("");
    try { await authenticate(mode, values); }
    catch (err) { setError(err.response?.data?.message || "Não foi possível conectar. Verifique sua conexão e tente novamente."); }
    finally { setBusy(false); }
  }
  function switchMode() { setMode(registering ? "login" : "register"); setError(""); setValues(current => ({ ...current, senha: "", confirmacao: "" })); }
  const inputClass = "mt-2 w-full rounded-xl border border-line bg-panelSoft px-4 py-3.5 text-sm text-white outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20 disabled:opacity-60";
  function field(name, label, props = {}) {
    return <label className="block text-sm font-medium text-ink" htmlFor={name}>{label}<input id={name} name={name} value={values[name]} onChange={change} className={inputClass} required disabled={busy} {...props} /></label>;
  }
  return (
    <div className="auth-screen min-h-screen text-ink">
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1.1fr_1fr]">
        <section className="relative flex flex-col justify-between overflow-hidden px-7 py-8 sm:px-14 lg:px-20 lg:py-12">
          <div className="relative z-10 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl border border-copper/40 text-copper" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v15M12 5C8 2 3 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Z" /></svg></span><span className="font-display text-3xl font-bold tracking-tight text-white">LitVerse<span className="text-copper">.</span></span></div>
          <div className="relative z-10 max-w-lg py-12 lg:py-20">
            <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-copper">Um universo de histórias</p>
            <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">Sua próxima história começa <span className="text-glow">aqui.</span></h1>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-mist">Organize suas leituras, descubra novos mundos e encontre pessoas que compartilham sua paixão pelos livros.</p>
            <div className="mt-10 hidden gap-3 sm:flex" aria-hidden="true">{[["01", "Descubra"], ["02", "Leia"], ["03", "Compartilhe"]].map(([number, text]) => <div key={number} className="flex-1 rounded-2xl border border-line/70 bg-panel/60 p-4"><span className="text-xs text-copper">{number}</span><p className="mt-3 text-sm text-white">{text}</p></div>)}</div>
          </div>
          <p className="relative z-10 hidden text-xs text-mist lg:block">Entre livros, ideias e novas conexões.</p>
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-forest/15 blur-3xl" aria-hidden="true" />
        </section>
        <main className="flex items-center justify-center border-line/60 px-5 pb-10 sm:px-10 lg:border-l lg:bg-midnight/50 lg:py-12">
          <section className="w-full max-w-md rounded-3xl border border-line bg-panel/90 p-7 shadow-card sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">Sua comunidade literária</p>
            <h2 className="mt-4 font-display text-3xl text-white">{registering ? "Escreva um novo capítulo" : "Bom ter você de volta"}</h2>
            <p className="mt-3 text-sm leading-relaxed text-mist">{registering ? "Crie sua conta e comece sua jornada no LitVerse." : "Entre na sua conta para continuar sua jornada de leitura."}</p>
            <form onSubmit={submit} className="mt-8 space-y-5" aria-busy={busy}>
              {registering ? <>{field("nome", "Seu nome", { autoComplete: "name", maxLength: 100, placeholder: "Como podemos chamar você?" })}{field("usuario", "Nome de usuário", { autoComplete: "username", pattern: "[a-zA-Z0-9_]{3,30}", title: "Use de 3 a 30 letras, números ou sublinhados", placeholder: "seu_usuario" })}{field("email", "E-mail", { type: "email", autoComplete: "email", maxLength: 254, placeholder: "voce@exemplo.com" })}</> : field("identificador", "E-mail ou nome de usuário", { autoComplete: "username", maxLength: 254, placeholder: "voce@exemplo.com", autoFocus: true })}
              <div><div className="relative">{field("senha", "Senha", { type: visible ? "text" : "password", autoComplete: registering ? "new-password" : "current-password", minLength: registering ? 8 : 1, maxLength: 128, placeholder: registering ? "Crie uma senha segura" : "Digite sua senha", style: { paddingRight: "5.5rem" } })}<button type="button" onClick={() => setVisible(!visible)} className="absolute bottom-3.5 right-4 text-xs font-semibold text-copper hover:text-glow" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible}>{visible ? "Ocultar" : "Mostrar"}</button></div>{registering && <p className="mt-2 text-xs text-mist">Use no mínimo 8 caracteres.</p>}</div>
              {registering && field("confirmacao", "Confirme sua senha", { type: visible ? "text" : "password", autoComplete: "new-password", maxLength: 128, placeholder: "Digite a senha novamente" })}
              {error && <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
              <button disabled={busy || loading} type="submit" className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-forest to-berry px-5 py-4 text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper disabled:cursor-wait disabled:opacity-60">{busy ? "Aguarde…" : registering ? "Criar minha conta" : "Entrar na minha conta"}<span aria-hidden="true">→</span></button>
            </form>
            <div className="mt-7 border-t border-line pt-6 text-center text-sm text-mist">{registering ? "Já faz parte do LitVerse?" : "Ainda não tem uma conta?"} <button type="button" disabled={busy} onClick={switchMode} className="font-semibold text-copper underline-offset-4 hover:underline">{registering ? "Entrar" : "Criar conta"}</button></div>
            <p className="mt-7 text-center text-xs leading-relaxed text-mist">Seu espaço para guardar leituras e compartilhar histórias.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
