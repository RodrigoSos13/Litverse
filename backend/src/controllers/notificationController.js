import { Follow } from "../models/Follow.js";
import { Like } from "../models/Like.js";
import { Comment } from "../models/Comment.js";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";

export async function getNotifications(req, res) {
  try {
    const checkedAt = new Date();
    const user = await User.findById(req.user._id).select("+notificationsReadAt");
    const posts = await Post.find({ usuario: req.user._id }).select("_id").lean();
    const publication = { $in: posts.map(post => post._id) };
    const filters = [
      { seguido: req.user._id, seguidor: { $ne: req.user._id } },
      { publicacao: publication, usuario: { $ne: req.user._id } },
      { publicacao: publication, usuario: { $ne: req.user._id } },
    ];
    const models = [Follow, Like, Comment];
    const types = ["follow", "like", "comment"];
    const readAt = user.notificationsReadAt || new Date(0);
    const groups = await Promise.all(models.map(async (model, index) => {
      const filter = { ...filters[index], createdAt: { $lte: checkedAt } };
      const [items, unread] = await Promise.all([
        model.find(filter).sort({ createdAt: -1 }).limit(30).populate(index === 0 ? "seguidor" : "usuario", "nome usuario urlAvatar").lean(),
        model.countDocuments({ ...filter, createdAt: { $gt: readAt, $lte: checkedAt } }),
      ]);
      return { unread, items: items.map(item => ({ _id: `${types[index]}-${item._id}`, tipo: types[index], ator: index === 0 ? item.seguidor : item.usuario, publicacao: item.publicacao, texto: item.texto, createdAt: item.createdAt, lida: item.createdAt <= readAt })) };
    }));
    res.json({ items: groups.flatMap(group => group.items).filter(item => item.ator).sort((a, b) => b.createdAt - a.createdAt).slice(0, 30), unread: groups.reduce((sum, group) => sum + group.unread, 0), checkedAt });
  } catch { res.status(503).json({ message: "Não foi possível carregar as notificações." }); }
}

export async function readNotifications(req, res) {
  const before = new Date(req.query.before);
  if (!Number.isFinite(before.getTime()) || before > new Date()) return res.status(400).json({ message: "Data inválida." });
  try {
    await User.updateOne({ _id: req.user._id }, { $max: { notificationsReadAt: before } });
    res.json({ message: "Notificações marcadas como lidas." });
  } catch { res.status(503).json({ message: "Não foi possível marcar as notificações." }); }
}
