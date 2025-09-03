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
import { AuthRequest } from "../middlewares/auth";
import { Auth } from "mongodb";

export const register = async (req: Request, res: Response) => {
  const { firstname, lastname, email, password } = req.body;
  try {
    const isExist = await User.findOne({ email });
    if (isExist) {
      return errorResponse(
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

// Get current user Endpoint

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return errorResponse(
        res,
        ERROR_CODES.USER_NOT_FOUND,
        ERROR_MESSAGES.USER_NOT_FOUND,
        null,
        404
      );
    }

    successResponse(res, { user }, "User profile retrived successfully");
  } catch (error: any) {
    errorResponse(
      res,
      ERROR_CODES.SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
      error.message,
      500
    );
  }
};

// update profile endpoint

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { firstname, lastname, avatar, preferences } = req.body;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(firstname && { firstname }),
        ...(lastname && { lastname }),
        ...(avatar && { avatar }),
        ...(preferences && { preferences }),
      },
      { new: true, runValidators: true }
    ).select("-password");
    if (!updatedUser) {
      return errorResponse(
        res,
        ERROR_CODES.USER_NOT_FOUND,
        ERROR_MESSAGES.USER_NOT_FOUND,
        null,
        404
      );
    }
    successResponse(res, { user: updatedUser }, "Profile updated successfully");
  } catch (error: any) {
    if (error.name === "ValidationError") {
      validationErrorResponse(res, error.errors);
    } else {
      errorResponse(
        res,
        ERROR_CODES.SERVER_ERROR,
        ERROR_MESSAGES.SERVER_ERROR,
        error.message,
        500
      );
    }
  }
};

// change password endpoint

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    if (!currentPassword || !newPassword) {
      return errorResponse(
        res,
        ERROR_CODES.MISSING_REQUIRED_FIELDS,
        "Current password and new password is required",
        null,
        400
      );
    }

    if (newPassword.length < 8) {
      return errorResponse(
        res,
        ERROR_CODES.PASSWORD_TOO_WEAK,
        ERROR_MESSAGES.PASSWORD_TOO_WEAK,
        null,
        400
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(
        res,
        ERROR_CODES.USER_NOT_FOUND,
        ERROR_MESSAGES.USER_NOT_FOUND,
        null,
        404
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return errorResponse(
        res,
        ERROR_CODES.INVALID_CREDENTIALS,
        "Current password is incorrect",
        null,
        401
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedNewPassword;
    await user.save();

    successResponse(res, {}, "Password changed successfully");
  } catch (error: any) {
    errorResponse(
      res,
      ERROR_CODES.SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
      error.message,
      500
    );
  }
};

// Logout functanality

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // we have to implement token blacklisting or refresh token invalidation here
    successResponse(res, {}, "Logged out successfully");
  } catch (error: any) {
    errorResponse(
      res,
      ERROR_CODES.SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
      error.message,
      500
    );
  }
};
