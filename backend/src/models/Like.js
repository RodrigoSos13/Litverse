import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

likeSchema.index({ publicacao: 1, usuario: 1 }, { unique: true });
likeSchema.index({ publicacao: 1, createdAt: -1 });

export const Like = mongoose.model("Curtida", likeSchema, "curtidas");
