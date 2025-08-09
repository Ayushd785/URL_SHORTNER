import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDb } from "./config/db";
import authRoutes from "./routes/authRoutes";
import urlRoutes from "./routes/urlRoutes";
import linkRoutes from "./routes/linkRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import { redirectUrl } from "./controllers/redirectUrl";
import qrRoutes from "./routes/qrRoutes";

dotenv.config();

const app: Application = express();
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Backend is live",
  });
});

// API routes - MUST COME BEFORE CATCH-ALL ROUTE
app.use("/api/auth", authRoutes);
app.use("/api/url", urlRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/qr",qrRoutes);

// Catch-all route for short URLs - MUST BE LAST
app.get("/:shortCode", redirectUrl);

const startServer = async () => {
  try {
    await connectDb();
    app.listen(3000, () => {
      console.log("server is running on port 3000");
    });
  } catch (err) {
    console.log("failed to connect");
    process.exit(1);
  }
};

startServer();
