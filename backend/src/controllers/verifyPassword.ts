import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { Url } from "../models/Url";

export const verifyPassword = async (req: Request, res: Response) => {
  const { shortCode, password } = req.body;

  try {
    const url = await Url.findOne({ shortCode });

    if (!url || !url.password) {
      return res.status(404).json({ msg: "Invalid or unprotected link" });
    }
    
    console.log("Verifying password for shortCode:", shortCode);
    const isValid = await bcrypt.compare(password, url.password);
    console.log("Password verification result:", isValid);
    
    if (!isValid) {
      return res.status(401).json({ msg: "Incorrect password" });
    }

    // Increment click count and save
    url.clickCount += 1;
    await url.save();

    return res.status(200).json({ longUrl: url.longUrl });
  } catch (err) {
    console.error("Password verification error:", err);
    return res.status(500).json({ msg: "Server error", err });
  }
};
