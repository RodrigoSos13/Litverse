import { Router } from "express";
import {
  createPost,
  deletePost,
  pinPost,
  getPostById,
  getPosts,
} from "../controllers/postController.js";

const router = Router();

router.get("/", getPosts);
router.post("/", createPost);
router.get("/:id", getPostById);
router.patch("/:id/pin", pinPost);
router.delete("/:id", deletePost);

export default router;
