import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    livro: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livro",
      default: null,
    },
    tipo: {
      type: String,
      enum: ["resenha", "fanart", "citacao", "opiniao"],
      required: true,
    },
    texto: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    imagens: {
      type: [String],
      default: [],
      validate: { validator: value => value.length <= 4, message: "Envie até 4 fotos." },
    },
    urlImagem: {
      type: String,
      default: "",
    },
    totalCurtidas: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalComentarios: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ usuario: 1, createdAt: -1 });
postSchema.index({ livro: 1, createdAt: -1 });
postSchema.index({ tipo: 1, createdAt: -1 });

export const Post = mongoose.model("Publicacao", postSchema, "publicacoes");
