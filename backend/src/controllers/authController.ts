import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "../utils/apiResponse";
import { ERROR_CODES, ERROR_MESSAGES } from "../constants/errorCodes";

export const register = async (req: Request, res: Response) => {
  const { firstname, lastname, email, password } = req.body;
  try {
    const isExist = await User.findOne({ email });
    if (isExist) {
      return; // NEW - Use this instead
      errorResponse(
        res,
        ERROR_CODES.EMAIL_ALREADY_EXISTS,
        ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
        null,
        409
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    successResponse(res, { user }, "User created Successfully", 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "ValidationError") {
      validationErrorResponse(res, (error as any).errors);
    } else {
      errorResponse(
        res,
        ERROR_CODES.SERVER_ERROR,
        ERROR_MESSAGES.SERVER_ERROR,
        error instanceof Error ? error.message : String(error),
        500
      );
    }
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return errorResponse(
        res,
        ERROR_CODES.USER_NOT_FOUND,
        ERROR_MESSAGES.USER_NOT_FOUND,
        null,
        404
      );
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return errorResponse(
        res,
        ERROR_CODES.INVALID_CREDENTIALS,
        ERROR_MESSAGES.INVALID_CREDENTIALS,
        null,
        401
      );
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      }
    );
    const userResponse = {
      _id: user._id,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      preferences: user.preferences,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    };

    successResponse(
      res,
      {
        token,
        user: userResponse,
      },
      "Login successful"
    );
  } catch (err) {
    console.error("Login error:", err);
    errorResponse(
      res,
      ERROR_CODES.SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
      err instanceof Error ? err.message : String(err),
      500
    );
  }
};
