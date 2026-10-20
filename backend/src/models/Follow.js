import mongoose from "mongoose";

const schema = new mongoose.Schema({
  seguidor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  seguido: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
}, { timestamps: true });
schema.index({ seguidor: 1, seguido: 1 }, { unique: true });
schema.index({ seguido: 1 });
export const Follow = mongoose.model("Follow", schema);
