import { Router } from "express";
import { createLike, removeLike } from "../controllers/likeController.js";

const router = Router();

router.post("/", createLike);
router.delete("/:postId/:userId", removeLike);

export default router;
