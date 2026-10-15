import { Comment } from "../models/Comment.js";
import { Post } from "../models/Post.js";
import { validateUploadedImage } from "../services/uploadedImage.js";

export async function createPost(req, res) {
  try {
    if (req.body.urlImagem) validateUploadedImage(req.body.urlImagem);
    if (req.body.tipo === "fanart" && !req.body.urlImagem) {
      return res.status(400).json({ message: "Envie uma imagem para publicar sua fanart." });
    }
    const post = await Post.create(req.body);
    const populatedPost = await Post.findById(post._id)
      .populate("usuario", "nome usuario urlAvatar")
      .populate("livro", "titulo autor urlCapa");

    res.status(201).json(populatedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getPosts(req, res) {
  try {
    const filter = {};

    if (req.query.user) {
      filter.usuario = req.query.user;
    }

    if (req.query.book) {
      filter.livro = req.query.book;
    }

    const posts = await Post.find(filter)
      .populate("usuario", "nome usuario urlAvatar")
      .populate("livro", "titulo autor urlCapa")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getPostById(req, res) {
  try {
    const post = await Post.findById(req.params.id)
      .populate("usuario", "nome usuario urlAvatar")
      .populate("livro", "titulo autor urlCapa");

    if (!post) {
      return res.status(404).json({ message: "Publicacao nao encontrada" });
    }

    const comments = await Comment.find({ publicacao: post._id })
      .populate("usuario", "nome usuario urlAvatar")
      .sort({ createdAt: -1 });

    res.json({ post, comentarios: comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
