import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDb } from "./config/db";
import authRoutes from "./routes/authRoutes";
import urlRoutes from "./routes/urlRoutes";
import { redirectUrl } from "./controllers/redirectUrl";

dotenv.config();

const app: Application = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Backend is live",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/url", urlRoutes);

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
