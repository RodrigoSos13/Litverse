import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    googleBooksId: { type: String, trim: true },
    googleBooksUrl: { type: String, default: "" },
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    autor: {
      type: String,
      required: true,
      trim: true,
    },
    genero: {
      type: String,
      required: true,
      trim: true,
    },
    totalPaginas: {
      type: Number,
      min: 1,
    },
    editora: {
      type: String,
      trim: true,
      default: "",
    },
    anoPublicacao: {
      type: Number,
      min: 0,
    },
    idioma: {
      type: String,
      trim: true,
      default: "pt",
    },
    isbn: {
      type: String,
      trim: true,
      default: "",
    },
    descricao: {
      type: String,
      required: true,
    },
    urlCapa: {
      type: String,
      default: "",
    },
    mediaAvaliacoes: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalAvaliacoes: {
      type: Number,
      default: 0,
      min: 0,
    },
    destaque: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.index(
  { titulo: "text", autor: "text" },
  { default_language: "portuguese", language_override: "idiomaTexto" }
);
bookSchema.index({ destaque: 1, createdAt: -1 });
bookSchema.index({ googleBooksId: 1 }, { unique: true, partialFilterExpression: { googleBooksId: { $type: "string" } } });

export const Book = mongoose.model("Livro", bookSchema, "livros");
