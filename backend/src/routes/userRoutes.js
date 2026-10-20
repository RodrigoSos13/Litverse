import { Router } from "express";
import {
  getUserProfile,
  getUsers,
  getConnections,
  setFollow,
  updateUser,
} from "../controllers/userController.js";

const router = Router();

router.get("/", getUsers);

router.get("/:id/:kind(followers|following)", getConnections);
router.get("/:id/profile", getUserProfile);
router.put("/:id", updateUser);
router.put("/:id/follow", setFollow);
router.delete("/:id/follow", setFollow);

export default router;
