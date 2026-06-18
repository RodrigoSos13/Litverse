import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    usuario: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    biografia: {
      type: String,
      default: "",
      maxlength: 280,
    },
    urlAvatar: {
      type: String,
      default: "",
    },
    totalSeguidores: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSeguindo: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("Usuario", userSchema, "usuarios");
