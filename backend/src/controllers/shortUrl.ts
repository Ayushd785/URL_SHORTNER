import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateCode } from "../utils/generateCode";
import { AuthRequest } from "../middlewares/auth";
import { Url } from "../models/Url";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "../utils/apiResponse";
import { ERROR_CODES, ERROR_MESSAGES } from "../constants/errorCodes";

export const shortUrl = async (req: AuthRequest, res: Response) => {
  const { longUrl } = req.body;
  const { password } = req.body;
  const userId = req.userId;

  if (!longUrl) {
    return res.status(409).json({
      msg: "Long url is required to move further",
    });
  }
  const shortCode = generateCode();
  const baseUrl = process.env.BASE_URL;
  const shortUrl = `${baseUrl}/${shortCode}`;

  // Hash password if provided
  let hashedPassword = undefined;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  try {
    const url = await Url.create({
      userId,
      longUrl,
      shortCode,
      password: hashedPassword,
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

export const createUrlWithCustomAlias = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { longUrl, customAlias, description, category, password, expiresAt } =
      req.body;
    const userId = req.userId;

    if (!longUrl) {
      return errorResponse(
        res,
        ERROR_CODES.MISSING_REQUIRED_FIELDS,
        "Long URL is required",
        null,
        400
      );
    }

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    if (customAlias) {
      const existingUrl = await Url.findOne({ customAlias });
      if (existingUrl) {
        return errorResponse(
          res,
          ERROR_CODES.ALIAS_ALREADY_EXISTS,
          ERROR_MESSAGES.ALIAS_ALREADY_EXISTS,
          null,
          409
        );
      }
    }

    const shortCode = customAlias || generateCode();

    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const shortUrl = `${baseUrl}/${shortCode}`;

    const url = await Url.create({
      userId,
      longUrl,
      shortCode,
      customAlias,
      description,
      category,
      password: hashedPassword,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: true,
    });

    successResponse(
      res,
      {
        shortUrl,
        shortCode: url.shortCode,
        longUrl: url.longUrl,
        customAlias: url.customAlias,
        description: url.description,
        category: url.category,
        expiresAt: url.expiresAt,
        isActive: url.isActive,
      },
      "URL created successfully"
    );
  } catch (error: any) {
    if (error.code === 11000) {
      return errorResponse(
        res,
        ERROR_CODES.ALIAS_ALREADY_EXISTS,
        ERROR_MESSAGES.ALIAS_ALREADY_EXISTS,
        null,
        409
      );
    }
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
