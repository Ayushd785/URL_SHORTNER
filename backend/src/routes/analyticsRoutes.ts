import express from "express";
import { authMiddleware } from "../middlewares/auth";
import { getDashboardStats, getLinkAnalytics } from "../controllers/analyticsController";

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard",getDashboardStats);
router.get("/link/:shortCode",getLinkAnalytics);

export default router;