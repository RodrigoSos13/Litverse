import { Router } from "express";
import {
  createPost,
  getPostById,
  getPosts,
} from "../controllers/postController.js";

const router = Router();

router.get("/", getPosts);
router.post("/", createPost);
router.get("/:id", getPostById);

export default router;
