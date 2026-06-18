import { Post } from "../models/Post.js";
import { Reading } from "../models/Reading.js";
import { User } from "../models/User.js";

export async function createUser(req, res) {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Usuario nao encontrado" });
    }

    const [readings, posts] = await Promise.all([
      Reading.find({ usuario: user._id }).populate("livro").sort({ updatedAt: -1 }),
      Post.find({ usuario: user._id })
        .populate("livro", "titulo autor urlCapa")
        .sort({ createdAt: -1 }),
    ]);

    const groupedReadings = {
      quero_ler: readings.filter((item) => item.status === "quero_ler"),
      lendo: readings.filter((item) => item.status === "lendo"),
      lido: readings.filter((item) => item.status === "lido"),
    };

    res.json({
      usuario: user,
      leituras: groupedReadings,
      posts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function updateUser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
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
