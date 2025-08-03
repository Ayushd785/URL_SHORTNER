import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const isExist = await User.findOne({ email });
    if (isExist) {
      return res.status(409).json({
        msg: "User with this email already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ msg: "User created Successfully", user });
  } catch (error) {
    res.status(500).json({
      msg: "Server is down",
      error,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(409).json({
        msg: "User does not exists",
      });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(409).json({
        msg: "Invalid credentials for user provided",
      });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );
    res.status(200).json({
      msg: "User is authenticated",
      token: token,
      user,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      msg: "Server is down",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
