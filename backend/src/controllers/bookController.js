import { Post } from "../models/Post.js";
import { Reading } from "../models/Reading.js";
import { Book } from "../models/Book.js";
import { isPortuguese } from "../services/googleBooks.js";
import { localBookSearchFilter } from "../services/bookSearch.js";

export async function createBook(req, res) {
  try {
    const fields = ["titulo", "autor", "genero", "descricao", "urlCapa", "destaque", "totalPaginas", "editora", "anoPublicacao", "idioma", "isbn"];
    const payload = Object.fromEntries(fields.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    if (!payload.idioma) payload.idioma = "pt";
    if (!isPortuguese(payload.idioma)) return res.status(400).json({ message: "O catálogo aceita apenas edições em português." });
    payload.idioma = "pt";
    const book = await Book.create(payload);
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getBooks(req, res) {
  try {
    const { search, featured } = req.query;
    const filter = { idioma: { $in: [/^pt(?:-(?:br|pt))?$/i, /^portugu[eê]s$/i, /^portuguese$/i] } };

    if (featured === "true") {
      filter.destaque = true;
    }

    if (search) {
      if (typeof search !== "string" || search.length > 200 || !search.trim()) return res.status(400).json({ message: "Informe uma busca válida de até 200 caracteres." });
      Object.assign(filter, localBookSearchFilter(search));
    }
    const books = await Book.find(filter).sort({ createdAt: -1 });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getBookById(req, res) {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Livro nao encontrado" });
    }

    const [posts, readingStats] = await Promise.all([
      Post.find({ livro: book._id })
        .populate("usuario", "nome usuario urlAvatar")
        .sort({ createdAt: -1 }),
      Reading.aggregate([
        { $match: { livro: book._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      livro: book,
      posts,
      estatisticasLeitura: readingStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
