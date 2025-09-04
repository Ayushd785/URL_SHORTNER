import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "../utils/apiResponse";
import { ERROR_CODES, ERROR_MESSAGES } from "../constants/errorCodes";
import { Url } from "../models/Url";
import { generateCode } from "../utils/generateCode";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

// Create new short link
export const createLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { originalUrl, customAlias, password, description } = req.body;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    if (!originalUrl) {
      return errorResponse(
        res,
        "INVALID_URL",
        "Original URL is required",
        null,
        400
      );
    }

    // Generate short code
    let shortCode;
    if (customAlias) {
      // Check if custom alias already exists
      const existingAlias = await Url.findOne({ shortCode: customAlias });
      if (existingAlias) {
        return errorResponse(
          res,
          ERROR_CODES.ALIAS_ALREADY_EXISTS,
          ERROR_MESSAGES.ALIAS_ALREADY_EXISTS,
          null,
          409
        );
      }
      shortCode = customAlias;
    } else {
      shortCode = generateCode();

      // Ensure generated code is unique
      while (await Url.findOne({ shortCode })) {
        shortCode = generateCode();
      }
    }

    // Hash password if provided
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create the URL document
    const newUrl = new Url({
      longUrl: originalUrl,
      shortCode,
      userId: new mongoose.Types.ObjectId(userId),
      password: hashedPassword,
      description: description || "",
      customAlias: customAlias || null,
    });

    await newUrl.save();

    // Return the created link
    const shortUrl = `${
      process.env.BASE_URL || "http://35.154.143.129:8080"
    }/${shortCode}`;

    successResponse(
      res,
      {
        link: {
          _id: newUrl._id,
          originalUrl: newUrl.longUrl,
          shortCode: newUrl.shortCode,
          shortUrl,
          clicks: newUrl.clickCount,
          createdAt: newUrl.createdAt,
          hasPassword: !!password,
          isActive: newUrl.isActive,
          description: newUrl.description,
        },
      },
      "Link created successfully",
      201
    );
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

// get users link with all the filters and search queries------->

export const getUserLinks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

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

    // Transform links to match frontend interface
    const transformedLinks = links.map((link) => ({
      _id: link._id,
      originalUrl: link.longUrl,
      shortCode: link.shortCode,
      shortUrl: `${process.env.BASE_URL || "http://35.154.143.129:8080"}/${
        link.shortCode
      }`,
      clicks: link.clickCount,
      createdAt: link.createdAt,
      hasPassword: !!link.password,
      isActive: link.isActive,
      description: link.description,
    }));

    successResponse(
      res,
      {
        links: transformedLinks,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      "Links retrieved successfully"
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

export const getLinkDetails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    const link = await Url.findOne({ id: id, userId }).select("-password");

    if (!link) {
      return errorResponse(
        res,
        ERROR_CODES.URL_NOT_FOUND,
        ERROR_MESSAGES.URL_NOT_FOUND
      );
    }

    successResponse(res, { link }, "Link details retrived successfully");
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

// update Link

export const updateLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { description, customAlias, category, isActive, expiresAt } =
      req.body;

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
      // a user can use his own existing previous custom alias again
      const existingLink = await Url.findOne({
        customAlias,
        userId: { $ne: userId },
      });

      if (existingLink) {
        return errorResponse(
          res,
          ERROR_CODES.ALIAS_ALREADY_EXISTS,
          ERROR_MESSAGES.ALIAS_ALREADY_EXISTS,
          null,
          409
        );
      }
    }

    const updatedLink = await Url.findOneAndUpdate(
      { _id: id, userId },
      {
        ...(description !== undefined && { description }),
        ...(customAlias !== undefined && { customAlias }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive }),
        ...(expiresAt !== undefined && { expiresAt }),
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedLink) {
      return errorResponse(
        res,
        ERROR_CODES.URL_NOT_FOUND,
        ERROR_MESSAGES.URL_NOT_FOUND,
        null,
        404
      );
    }

    successResponse(res, { link: updateLink }, "Link updated successfully");
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

// delete link -------->

export const deleteLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    const deleteLink = await Url.findOneAndDelete({ _id: id, userId });

    if (!deleteLink) {
      return errorResponse(
        res,
        ERROR_CODES.URL_NOT_FOUND,
        ERROR_MESSAGES.URL_NOT_FOUND,
        null,
        404
      );
    }

    successResponse(res, {}, "Link deleted successfully");
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

// toggle Link status for active or inactive

export const toggleLinkStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }
    const link = await Url.findOne({ _id: id, userId });

    if (!link) {
      return errorResponse(
        res,
        ERROR_CODES.URL_NOT_FOUND,
        ERROR_MESSAGES.URL_NOT_FOUND,
        null,
        404
      );
    }

    link.isActive = !link.isActive;
    await link.save();

    successResponse(
      res,
      {
        link: {
          _id: link._id,
          isActive: link.isActive,
        },
      },
      `Link ${link.isActive ? "activated" : "deactivated"} successfully`
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

// Get dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
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

    // Get total links count
    const totalLinks = await Url.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
    });

    // Get total clicks
    const clicksResult = await Url.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalClicks: { $sum: "$clickCount" } } },
    ]);
    const totalClicks =
      clicksResult.length > 0 ? clicksResult[0].totalClicks : 0;

    // Calculate monthly growth (simplified - you can enhance this)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const currentMonthLinks = await Url.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: currentMonth },
    });

    const previousMonthLinks = await Url.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: previousMonth, $lt: currentMonth },
    });

    let monthlyGrowth = 0;
    if (previousMonthLinks > 0) {
      monthlyGrowth = Math.round(
        ((currentMonthLinks - previousMonthLinks) / previousMonthLinks) * 100
      );
    } else if (currentMonthLinks > 0) {
      monthlyGrowth = 100;
    }

    successResponse(
      res,
      {
        stats: {
          totalLinks,
          totalClicks,
          monthlyGrowth,
        },
      },
      "Dashboard stats retrieved successfully"
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
