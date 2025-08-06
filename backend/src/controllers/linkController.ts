import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
} from "../utils/apiResponse";
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

    if (!updateLink) {
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
  } catch (error) {
    errorResponse(
      res,
      ERROR_CODES.SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
      error.message,
      500
    );
  }
};
