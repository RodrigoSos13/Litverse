import { Router } from "express";
import {
  createBook,
  getBookById,
  getBooks,
} from "../controllers/bookController.js";

const router = Router();

router.get("/", getBooks);
router.post("/", createBook);
router.get("/:id", getBookById);

export default router;
