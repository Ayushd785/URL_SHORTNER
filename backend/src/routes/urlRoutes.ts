import express from "express";
const router = express.Router();

import { authMiddleware } from "../middlewares/auth";
import { shortUrl } from "../controllers/shortUrl";
import { verifyPassword } from "../controllers/verifyPassword";

router.post("/shorten", authMiddleware, shortUrl);
router.post("/verify", verifyPassword);
export default router;
