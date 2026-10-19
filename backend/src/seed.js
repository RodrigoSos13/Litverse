import { validateEmailKeys } from "./auth/emailPrivacy.js";
import { hashPassword } from "./auth/password.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { Book } from "./models/Book.js";
import { Comment } from "./models/Comment.js";
import { Like } from "./models/Like.js";
import { Post } from "./models/Post.js";
import { Reading } from "./models/Reading.js";
import { User } from "./models/User.js";

dotenv.config();

async function seed() {
  validateEmailKeys();
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8 || password.length > 128) throw new Error("Defina SEED_PASSWORD com 8 a 128 caracteres para as contas de demonstração.");
  const passwordHash = await hashPassword(password);
  await connectDatabase();

  await mongoose.connection.dropDatabase();

  await Promise.all([
    User.syncIndexes(),
    Book.syncIndexes(),
    Reading.syncIndexes(),
    Post.syncIndexes(),
    Comment.syncIndexes(),
    Like.syncIndexes(),
  ]);

  const [alice, leo] = await User.create([
    {
      passwordHash,
      nome: "Alice Moraes",
      usuario: "alicelivros",
      email: "alice@litverse.com",
      biografia: "Leitora de fantasia, drama e margens anotadas.",
      urlAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      totalSeguidores: 128,
      totalSeguindo: 84,
    },
    {
      passwordHash,
      nome: "Leo Martins",
      usuario: "leoleituras",
      email: "leo@litverse.com",
      biografia: "Publicando opinioes rapidas e listas enormes de proximas leituras.",
      urlAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
      totalSeguidores: 76,
      totalSeguindo: 102,
    },
  ]);

  const [hobbit, dune, pride] = await Book.create([
    {
      idioma: "pt",
      titulo: "O Hobbit",
      autor: "J.R.R. Tolkien",
      genero: "Fantasia",
      descricao: "Bilbo Bolseiro deixa sua vida tranquila para embarcar em uma aventura perigosa com anoes e um mago.",
      urlCapa: "https://m.media-amazon.com/images/I/91zdxRRvabL._UF1000,1000_QL80_.jpg",
      destaque: true,
      mediaAvaliacoes: 4.8,
      totalAvaliacoes: 2,  
    },
    {
      idioma: "pt",
      titulo: "Duna",
      autor: "Frank Herbert",
      genero: "Ficcao Cientifica",
      descricao: "Politica, profecia e sobrevivencia moldam o destino de Arrakis e de Paul Atreides.",
      urlCapa: "https://m.media-amazon.com/images/I/81zN7udGRUL.jpg",
      destaque: true,
      mediaAvaliacoes: 4.5,
      totalAvaliacoes: 1,
    },
    {
      idioma: "pt",
      titulo: "Orgulho e Preconceito",
      autor: "Jane Austen",
      genero: "Classico",
      descricao: "Elizabeth Bennet enfrenta o amor, as expectativas de classe e os julgamentos da primeira impressao.",
      urlCapa: "https://comicboom.com.br/shop/wp-content/uploads/2024/07/orgulhoepreconceitocp.jpg",
      destaque: false,
      mediaAvaliacoes: 4.0,
      totalAvaliacoes: 1,
    },
  ]);

  await Reading.create([
    { usuario: alice._id, livro: hobbit._id, status: "lido", nota: 5 },
    { usuario: alice._id, livro: dune._id, status: "lendo", nota: null },
    { usuario: alice._id, livro: pride._id, status: "quero_ler", nota: null },
    { usuario: leo._id, livro: hobbit._id, status: "lido", nota: 4.5 },
    { usuario: leo._id, livro: dune._id, status: "lido", nota: 4.5 },
  ]);

  const [post1, post2, post3] = await Post.create([
    {
      usuario: alice._id,
      livro: hobbit._id,
      tipo: "resenha",
      texto: "Uma leitura aconchegante, com aventura, cancoes e um mundo que ainda parece enorme.",
      urlImagem: "https://images.unsplash.com/photo-1511108690759-009324a90311",
      totalCurtidas: 2,
      totalComentarios: 1,
    },
    {
      usuario: leo._id,
      livro: dune._id,
      tipo: "opiniao",
      texto: "A tensao politica e incrivel, mas o glossario esta trabalhando duro por mim.",
      urlImagem: "",
      totalCurtidas: 1,
      totalComentarios: 1,
    },
    {
      usuario: alice._id,
      tipo: "citacao",
      texto: "Ha algo de bom neste mundo, e vale a pena lutar por isso.",
      urlImagem: "",
      totalCurtidas: 0,
      totalComentarios: 0,
    },
  ]);

  await Comment.create([
    {
      publicacao: post1._id,
      usuario: leo._id,
      texto: "Isso me deu vontade de reler imediatamente.",
    },
    {
      publicacao: post2._id,
      usuario: alice._id,
      texto: "O glossario vira um amigo ali pelo terceiro capitulo.",
    },
  ]);

  await Like.create([
    { publicacao: post1._id, usuario: alice._id },
    { publicacao: post1._id, usuario: leo._id },
    { publicacao: post2._id, usuario: alice._id },
  ]);

  console.log("Carga inicial concluida");
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error("Erro na carga inicial:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});
