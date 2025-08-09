import express from "express";
const router = express.Router();
import { authMiddleware } from "../middlewares/auth";
import {
  downloadQRCode,
  generateCustomQRCode,
  generateQRCode,
} from "../controllers/qrController";

router.use(authMiddleware);

router.get("/generate/:shortCode", generateQRCode);
router.get("/download/:shortCode", downloadQRCode);
router.post("/custom", generateCustomQRCode);

export default router;
