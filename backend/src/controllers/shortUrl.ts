import { Request, Response } from "express";

import { generateCode } from "../utils/generateCode";
import { AuthRequest } from "../middlewares/auth";
import { Url } from "../models/Url";

export const shortUrl = async (req: AuthRequest, res: Response) => {
  const { longUrl } = req.body;
  const userId = req.userId;

  if (!longUrl) {
    return res.status(409).json({
      msg: "Long url is required to move further",
    });
  }
  const shortCode = generateCode();
  const baseUrl = process.env.BASE_URL;
  const shortUrl = `${baseUrl}/${shortCode}`;

  try {
    const url = await Url.create({
      userId,
      longUrl,
      shortCode,
    });

    res.status(200).json({
      msg: "Short url created",
      shortUrl,
      shortCode: url.shortCode,
      longUrl: url.longUrl,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Server error",
      err,
    });
  }
};
