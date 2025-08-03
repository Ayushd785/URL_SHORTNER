import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token){
    return res.status(409).json({
      msg: "Token is not provided in a valid format",
    });
  }

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {userId: string};
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};
