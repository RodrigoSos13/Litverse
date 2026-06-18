import mongoose from "mongoose";

const readingSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    livro: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Livro",
      required: true,
    },
    status: {
      type: String,
      enum: ["quero_ler", "lendo", "lido"],
      required: true,
    },
    nota: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

readingSchema.index({ usuario: 1, livro: 1 }, { unique: true });
readingSchema.index({ usuario: 1, status: 1 });
readingSchema.index({ livro: 1, status: 1 });

export const Reading = mongoose.model("Leitura", readingSchema, "leituras");
