import {
  deleteLink,
  getLinkDetails,
  getUserLinks,
  toggleLinkStatus,
  updateLink,
} from "../controllers/linkController";
import { authMiddleware } from "../middlewares/auth";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getUserLinks);
router.get("/:id", getLinkDetails);
router.put("/:id", updateLink);
router.delete("/:id", deleteLink);
router.put("/:id/status", toggleLinkStatus);

export default router;
