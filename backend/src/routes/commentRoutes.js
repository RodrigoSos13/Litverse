import { Router } from "express";
import {
  createComment,
  getComments,
  updateCommentLike,
} from "../controllers/commentController.js";

const router = Router();

router.get("/", getComments);
router.post("/", createComment);
router.put("/:id/like", updateCommentLike);
router.delete("/:id/like", updateCommentLike);

export default router;
