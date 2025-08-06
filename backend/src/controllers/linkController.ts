import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { errorResponse, successResponse } from "../utils/apiResponse";
import { ERROR_CODES, ERROR_MESSAGES } from "../constants/errorCodes";
import { Url } from "../models/Url";

// get users link with all the filters and search queries------->

export const getUserLinks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.body;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    const query: any = { userId };

    if (search) {
      query.$or = [
        { longUrl: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { shortCode: { $regex: search, $options: "i" } },
        { customAlias: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.isActive = status === "active";
    }

    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);

    const links = await Url.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select("-password");

    const total = await Url.countDocuments(query);

    successResponse(
      res,
      {
        links,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      "Links retrived successfully"
    );
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

// get users specific Link details ------->


