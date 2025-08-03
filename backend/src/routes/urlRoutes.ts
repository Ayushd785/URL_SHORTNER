import express from "express";
const router = express.Router();

import { authMiddleware } from "../middlewares/auth";
import { shortUrl } from "../controllers/shortUrl";


router.post("/shorten", authMiddleware, shortUrl);

export default router;
