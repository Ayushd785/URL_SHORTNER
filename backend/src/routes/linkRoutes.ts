import {
  deleteLink,
  getLinkDetails,
  getUserLinks,
  toggleLinkStatus,
  updateLink,
  createLink,
  getDashboardStats,
} from "../controllers/linkController";
import { authMiddleware } from "../middlewares/auth";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

// Create new link
router.post("/create", createLink);

// Get user links and stats
router.get("/", getUserLinks); // This handles /api/links with query params
router.get("/user", getUserLinks); // Alternative endpoint
router.get("/dashboard-stats", getDashboardStats);

// Individual link operations
router.get("/:id", getLinkDetails);
router.put("/:id", updateLink);
router.delete("/:id", deleteLink);
router.put("/:id/status", toggleLinkStatus);

export default router;
