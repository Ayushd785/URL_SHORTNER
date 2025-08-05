import express from "express";
import { changePassword, getCurrentUser, login, logout, register, updateProfile } from "../controllers/authController";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// public routes no authentication middleware is required here
router.post("/register", register);
router.post("/login", login);



// protected routes auth middleware is required here
// only user with jwt token can perform these activities

router.get("/me",authMiddleware,getCurrentUser);
router.put("/profile",authMiddleware,updateProfile);
router.put("/password",authMiddleware,changePassword);
router.post("/logout",authMiddleware,logout);

export default router;
