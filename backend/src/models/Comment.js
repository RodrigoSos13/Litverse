import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    publicacao: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Publicacao",
      required: true,
    },
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    texto: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ publicacao: 1, createdAt: -1 });

export const Comment = mongoose.model("Comentario", commentSchema, "comentarios");
