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
app.use(
  cors({
    origin: [
      "http://localhost:8080", // Local development
      "http://localhost:3000", // Local development alternative
      "https://your-frontend-domain.com", // Production frontend (when deployed)
      // Add more origins as needed
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
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
app.use("/api/qr", qrRoutes);

// Catch-all route for short URLs - MUST BE LAST
app.get("/:shortCode", redirectUrl);

const startServer = async () => {
  try {
    await connectDb();
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (err) {
    console.log("failed to connect");
    process.exit(1);
  }
};

startServer();
