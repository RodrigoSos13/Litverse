import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../services/api";

const initialForm = {
  tipo: "resenha",
  texto: "",
  urlImagem: "",
  livro: "",
};

function CreatePostPage() {
  const [form, setForm] = useState(initialForm);
  const [books, setBooks] = useState([]);
  const { currentUserId } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/books")
      .then((booksResponse) => setBooks(booksResponse.data))
      .catch(console.error);
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      usuario: currentUserId,
      livro: form.livro || null,
    };

    if (!payload.usuario) {
      return;
    }

    await api.post("/posts", payload);
    navigate("/");
  }

  return (
    <section className="mx-auto max-w-3xl rounded-[2rem] border border-line bg-panel p-8 shadow-card">
      <p className="text-sm uppercase tracking-[0.22em] text-copper">Compartilhe com a comunidade</p>
      <h1 className="mt-3 font-display text-4xl">Criar novo post</h1>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {!currentUserId && (
          <p className="rounded-2xl bg-panelSoft px-4 py-3 text-sm text-mist">
            Abra um perfil para escolher o usuario antes de publicar posts.
          </p>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-600" htmlFor="tipo">
            Tipo de post
          </label>
          <select
            id="tipo"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="w-full rounded-2xl border border-line px-4 py-3"
          >
            <option value="resenha">Resenha</option>
            <option value="citacao">Citacao</option>
            <option value="opiniao">Opiniao</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-600" htmlFor="texto">
            Texto
          </label>
          <textarea
            id="texto"
            name="texto"
            value={form.texto}
            onChange={handleChange}
            rows="6"
            className="w-full rounded-2xl border border-line px-4 py-3"
            placeholder="Escreva seu pensamento literario..."
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-600" htmlFor="urlImagem">
            URL da imagem
          </label>
          <input
            id="urlImagem"
            name="urlImagem"
            value={form.urlImagem}
            onChange={handleChange}
            className="w-full rounded-2xl border border-line px-4 py-3"
            placeholder="https://"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-stone-600" htmlFor="livro">
            Livro relacionado
          </label>
          <select
            id="livro"
            name="livro"
            value={form.livro}
            onChange={handleChange}
            className="w-full rounded-2xl border border-line px-4 py-3"
          >
            <option value="">Nenhum livro relacionado</option>
            {books.map((book) => (
              <option key={book._id} value={book._id}>
                {book.titulo} - {book.autor}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!currentUserId}
          className="rounded-full bg-gradient-to-r from-forest to-berry px-6 py-3 font-semibold text-white transition hover:brightness-110"
        >
          Publicar post
        </button>
      </form>
    </section>
  );
}

export default CreatePostPage;
