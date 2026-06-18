import { Comment } from "../models/Comment.js";
import { Post } from "../models/Post.js";

export async function createComment(req, res) {
  try {
    const comment = await Comment.create(req.body);
    await Post.findByIdAndUpdate(req.body.publicacao, { $inc: { totalComentarios: 1 } });

    const populatedComment = await Comment.findById(comment._id).populate(
      "usuario",
      "nome usuario urlAvatar"
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getComments(req, res) {
  try {
    const filter = req.query.post ? { publicacao: req.query.post } : {};

    const comments = await Comment.find(filter)
      .populate("usuario", "nome usuario urlAvatar")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
