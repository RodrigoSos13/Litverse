import mongoose from "mongoose";
import { Book } from "../models/Book.js";
import { Reading } from "../models/Reading.js";

async function refreshBookRating(bookId) {
  const result = await Reading.aggregate([
    {
      $match: {
        livro: new mongoose.Types.ObjectId(bookId),
        nota: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$livro",
        mediaAvaliacoes: { $avg: "$nota" },
        totalAvaliacoes: { $sum: 1 },
      },
    },
  ]);

  const payload = result[0] || { mediaAvaliacoes: 0, totalAvaliacoes: 0 };

  await Book.findByIdAndUpdate(bookId, {
    mediaAvaliacoes: Number(payload.mediaAvaliacoes.toFixed(1)),
    totalAvaliacoes: payload.totalAvaliacoes,
  });
}

export async function upsertReading(req, res) {
  try {
    const reading = await Reading.findOneAndUpdate(
      { usuario: req.body.usuario, livro: req.body.livro },
      req.body,
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate("livro").populate("usuario", "nome usuario urlAvatar");

    if (req.body.nota !== undefined) {
      await refreshBookRating(req.body.livro);
    }

    res.status(201).json(reading);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getReadings(req, res) {
  try {
    const filter = {};

    if (req.query.user) {
      filter.usuario = req.query.user;
    }

    if (req.query.book) {
      filter.livro = req.query.book;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const readings = await Reading.find(filter)
      .populate("usuario", "nome usuario")
      .populate("livro", "titulo autor urlCapa")
      .sort({ updatedAt: -1 });

    res.json(readings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
