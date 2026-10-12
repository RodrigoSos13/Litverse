import { Router } from "express";
import {
  getUserProfile,
  getUsers,
  updateUser,
} from "../controllers/userController.js";

const router = Router();

router.get("/", getUsers);

router.get("/:id/profile", getUserProfile);
router.put("/:id", updateUser);

export default router;
