import { useState } from "react";
import api from "../services/api";

const initialForm = {
  nome: "",
  usuario: "",
  email: "",
  biografia: "",
};

function UserSignupCard({ onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await api.post("/users", form);
      setForm(initialForm);
      onCreated?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-line bg-panel p-4 shadow-card">
      <h2 className="font-display text-2xl text-white">Cadastro rapido</h2>
      <p className="mt-1 text-sm text-white">Crie um usuario de demonstracao para interagir com o LitVerse.</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <input
          name="nome"
          value={form.nome}
          onChange={handleChange}
          placeholder="Nome"
          className="w-full rounded-2xl border border-line px-4 py-3 text-sm"
          required
        />
        <input
          name="usuario"
          value={form.usuario}
          onChange={handleChange}
          placeholder="Nome de usuario"
          className="w-full rounded-2xl border border-line px-4 py-3 text-sm"
          required
        />
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="E-mail"
          className="w-full rounded-2xl border border-line px-4 py-3 text-sm"
          required
        />
        <textarea
          name="biografia"
          value={form.biografia}
          onChange={handleChange}
          placeholder="Bio"
          rows="3"
          className="w-full rounded-2xl border border-line px-4 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-forest to-berry px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          Criar usuario
        </button>
      </form>
    </section>
  );
}

export default UserSignupCard;
