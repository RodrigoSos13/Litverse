import { Like } from "../models/Like.js";
import { Post } from "../models/Post.js";
import { Reading } from "../models/Reading.js";
import { User } from "../models/User.js";

export async function getUsers(req, res) {
  try {
    const users = await User.find().select("-email").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-email");

    if (!user) {
      return res.status(404).json({ message: "Usuario nao encontrado" });
    }

    const [readings, posts] = await Promise.all([
      Reading.find({ usuario: user._id }).populate("livro").sort({ updatedAt: -1 }),
      Post.find({ usuario: user._id })
        .populate("usuario", "nome usuario urlAvatar")
        .populate("livro", "titulo autor urlCapa")
        .sort({ fixadoNoPerfil: -1, createdAt: -1 }),
    ]);

    const likes = await Like.find({ usuario: req.user._id, publicacao: { $in: posts.map(post => post._id) } }).select("publicacao").lean();
    const liked = new Set(likes.map(like => String(like.publicacao)));

    const groupedReadings = {
      quero_ler: readings.filter((item) => item.status === "quero_ler"),
      lendo: readings.filter((item) => item.status === "lendo"),
      lido: readings.filter((item) => item.status === "lido"),
    };

    res.json({
      usuario: user,
      leituras: groupedReadings,
      posts: posts.map(post => ({ ...post.toObject(), curtido: liked.has(String(post._id)) })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateUser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, Object.fromEntries(["nome", "biografia", "urlAvatar"].filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]])), {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario nao encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
