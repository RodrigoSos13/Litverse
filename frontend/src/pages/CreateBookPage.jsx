import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import BookCatalog from "../components/BookCatalog";

const initialForm = {
  titulo: "",
  autor: "",
  genero: "",
  totalPaginas: "",
  editora: "",
  anoPublicacao: "",
  idioma: "pt",
  isbn: "",
  urlCapa: "",
  descricao: "",
  destaque: false,
};

function CreateBookPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const payload = {
      titulo: form.titulo.trim(),
      autor: form.autor.trim(),
      genero: form.genero.trim(),
      descricao: form.descricao.trim(),
      urlCapa: form.urlCapa.trim(),
      editora: form.editora.trim(),
      idioma: "pt",
      isbn: form.isbn.trim(),
      destaque: form.destaque,
      totalPaginas: form.totalPaginas ? Number(form.totalPaginas) : undefined,
      anoPublicacao: form.anoPublicacao ? Number(form.anoPublicacao) : undefined,
    };

    try {
      const response = await api.post("/books", payload, { timeout: 10000 });
      setForm(initialForm);
      navigate(`/books/${response.data._id}`);
    } catch (error) {
      console.error(error);
      if (error.code === "ECONNABORTED") {
        setErrorMessage("O cadastro demorou demais para responder. Verifique se o backend esta rodando e tente novamente.");
      } else if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Não foi possível cadastrar o livro agora. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl rounded-[2rem] border border-line bg-panel p-8 shadow-card">
      <p className="text-sm uppercase tracking-[0.22em] text-copper">Expanda o catalogo</p>
      <h1 className="mt-3 font-display text-4xl">Encontre seu próximo livro</h1>
      <p className="mt-3 max-w-2xl text-sm text-mist">
        Encontre uma edição no catálogo ou cadastre um novo livro abaixo.
      </p>
      <div className="mt-8"><BookCatalog showSearchForm /></div>
      <details className="mt-10 border-t border-line pt-6"><summary className="cursor-pointer text-lg font-semibold text-copper">Cadastrar um livro manualmente</summary>
      {errorMessage && (
        <p className="mt-4 rounded-2xl border border-forest/40 bg-forest/10 px-4 py-3 text-sm text-glow">
          {errorMessage}
        </p>
      )}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-mist" htmlFor="titulo">
              Titulo do livro
            </label>
            <input
              id="titulo"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              className="w-full rounded-2xl border border-line px-4 py-3"
              placeholder="The Hobbit"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-mist" htmlFor="autor">
              Autor
            </label>
            <input
              id="autor"
              name="autor"
              value={form.autor}
              onChange={handleChange}
              className="w-full rounded-2xl border border-line px-4 py-3"
              placeholder="J.R.R. Tolkien"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-mist" htmlFor="genero">
              Genero
            </label>
            <input
              id="genero"
              name="genero"
              value={form.genero}
              onChange={handleChange}
              className="w-full rounded-2xl border border-line px-4 py-3"
              placeholder="Fantasia"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-mist" htmlFor="totalPaginas">
              Quantidade de paginas
            </label>
            <input
              id="totalPaginas"
              name="totalPaginas"
              type="number"
              min="1"
              value={form.totalPaginas}
              onChange={handleChange}
              className="w-full rounded-2xl border border-line px-4 py-3"
              placeholder="310"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-mist" htmlFor="editora">
              Editora
            </label>
            <input
              id="editora"
              name="editora"
              value={form.editora}
              onChange={handleChange}
              className="w-full rounded-2xl border border-line px-4 py-3"
              placeholder="HarperCollins"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-mist" htmlFor="anoPublicacao">
              Ano de publicacao
            </label>
            <input
              id="anoPublicacao"
              name="anoPublicacao"
              type="number"
              min="0"
              value={form.anoPublicacao}
              onChange={handleChange}
              className="w-full rounded-2xl border border-line px-4 py-3"
              placeholder="1937"
            />
          </div>

          <div className="flex items-center rounded-2xl border border-line bg-panelSoft px-4 py-3 text-sm text-mist">Idioma: Português</div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-mist" htmlFor="isbn">
              ISBN
            </label>
            <input
              id="isbn"
              name="isbn"
              value={form.isbn}
              onChange={handleChange}
              className="w-full rounded-2xl border border-line px-4 py-3"
              placeholder="9780000000000"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-mist" htmlFor="urlCapa">
            URL da capa
          </label>
          <input
            id="urlCapa"
            name="urlCapa"
            value={form.urlCapa}
            onChange={handleChange}
            className="w-full rounded-2xl border border-line px-4 py-3"
            placeholder="https://"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-mist" htmlFor="descricao">
            Descricao
          </label>
          <textarea
            id="descricao"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            rows="6"
            className="w-full rounded-2xl border border-line px-4 py-3"
            placeholder="Escreva um resumo, sinopse ou uma breve apresentacao do livro..."
            required
          />
        </div>

        <label className="flex items-center gap-3 rounded-2xl bg-panelSoft px-4 py-3 text-sm text-ink">
          <input
            type="checkbox"
            name="destaque"
            checked={form.destaque}
            onChange={handleChange}
            className="h-4 w-4 rounded border-stone-300 text-copper focus:ring-copper"
          />
          Marcar este livro como destaque na pagina inicial
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-gradient-to-r from-forest to-berry px-6 py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Cadastrar livro"}
        </button>
      </form>
      </details>
    </section>
  );
}

export default CreateBookPage;
