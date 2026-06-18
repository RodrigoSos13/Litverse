import { Like } from "../models/Like.js";
import { Post } from "../models/Post.js";

export async function createLike(req, res) {
  try {
    const like = await Like.create(req.body);
    await Post.findByIdAndUpdate(req.body.publicacao, { $inc: { totalCurtidas: 1 } });
    res.status(201).json(like);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function removeLike(req, res) {
  try {
    const like = await Like.findOneAndDelete({
      publicacao: req.params.postId,
      usuario: req.params.userId,
    });

    if (!like) {
      return res.status(404).json({ message: "Curtida nao encontrada" });
    }

    await Post.findByIdAndUpdate(req.params.postId, { $inc: { totalCurtidas: -1 } });
    res.json({ message: "Curtida removida" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
