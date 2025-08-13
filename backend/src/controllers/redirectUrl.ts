import express from "express";
const router = express.Router();
import { Request, Response } from "express";
import { Url } from "../models/Url";
import { detectDevice, getClientIP } from "../utils/deviceDetection";
import { Analytics } from "../models/Analytics";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
export const redirectUrl = async (req: Request, res: Response) => {
  const { shortCode } = req.params;

  try {
    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(409).json({
        msg: "Url not found",
      });
    }

    // check if URL has expired
    if (url.expiresAt && new Date() > url.expiresAt) {
      return res.status(410).json({
        msg: "This link has expired",
      });
    }

    // check if the URL is active
    if (!url.isActive) {
      return res.status(410).json({
        msg: "This link has been deactivated",
      });
    }

    if (url.password) {
      return res.redirect(`${FRONTEND_URL}/verify/${shortCode}`);
    }

    // Get device and location info
    const userAgent = req.headers["user-agent"] || " ";
    const ipAddress = getClientIP(req);
    const deviceInfo = detectDevice(userAgent, ipAddress);

    const existingClick = await Analytics.findOne({
      shortCode,
      ipAddress,
    });
    const isUnique = !existingClick;

    await Analytics.create({
      shortCode,
      userId: url.userId,
      clickedAt: new Date(),
      ipAddress,
      userAgent,
      country: deviceInfo.country,
      city: deviceInfo.city,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      referrer: req.headers.referer || req.headers.referrer,
      isUnique,
    });

    url.clickCount += 1;
    if (isUnique) {
      url.uniqueClicks += 1;
    }
    url.lastClickedAt = new Date();
    await url.save();

    res.redirect(url.longUrl);
  } catch (err) {
    res.status(500).json({ msg: "Server error", err });
  }
};
