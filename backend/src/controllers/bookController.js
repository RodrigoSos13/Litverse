import { Post } from "../models/Post.js";
import { Reading } from "../models/Reading.js";
import { Book } from "../models/Book.js";

export async function createBook(req, res) {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getBooks(req, res) {
  try {
    const { search, featured } = req.query;
    const filter = {};

    if (featured === "true") {
      filter.destaque = true;
    }

    let query = Book.find(filter);

    if (search) {
      filter.$text = { $search: search };
      query = query.select({ score: { $meta: "textScore" } });
    }

    const books = await query.sort(
      search ? { score: { $meta: "textScore" } } : { createdAt: -1 }
    );

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
