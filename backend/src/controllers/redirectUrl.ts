import express from "express";
const router = express.Router();
import { Request, Response } from "express";
import { Url } from "../models/Url";

const FRONTEND_URL = "http://localhost:5173";
export const redirectUrl = async (req: Request, res: Response) => {
  const { shortCode } = req.params;

  try {
    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(409).json({
        msg: "Url not found",
      });
    }

    if (url.password) {
      return res.redirect(`${FRONTEND_URL}/verify/${shortCode}`);
    }

    url.clickCount += 1;
    await url.save();

    res.redirect(url.longUrl);
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};
