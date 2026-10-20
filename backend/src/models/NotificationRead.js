import mongoose from "mongoose";

const schema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  tipo: { type: String, enum: ["follow", "like", "comment"], required: true },
  evento: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true });
schema.index({ usuario: 1, tipo: 1, evento: 1 }, { unique: true });
export const NotificationRead = mongoose.model("NotificationRead", schema);
