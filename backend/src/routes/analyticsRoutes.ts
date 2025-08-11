import express from "express";
import { authMiddleware } from "../middlewares/auth";
import { getDashboardStats, getDetailedAnalytics, getLinkAnalytics, getRealTimeAnalytics } from "../controllers/analyticsController";

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard",getDashboardStats);
router.get("/link/:shortCode",getLinkAnalytics);
router.get("/detailed",getDetailedAnalytics);
router.get("/realtime",getRealTimeAnalytics);

export default router;