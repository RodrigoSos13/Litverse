import { Router } from "express";
import {
  getReadings,
  upsertReading,
} from "../controllers/readingController.js";

const router = Router();

router.get("/", getReadings);
router.post("/", upsertReading);

export default router;
