import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import { Analytics } from "../models/Analytics";
import { Url } from "../models/Url";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { ERROR_CODES, ERROR_MESSAGES } from "../constants/errorCodes";

// Get dashboard overview statistics
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

    // Get total links
    const totalLinks = await Url.countDocuments({ userId });

    // Get total clicks
    const totalClicks = await Url.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: null, total: { $sum: "$clickCount" } } },
    ]);

    // Get clicks today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clicksToday = await Analytics.countDocuments({
      userId,
      clickedAt: { $gte: today },
    });

    // Get clicks this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const clicksThisWeek = await Analytics.countDocuments({
      userId,
      clickedAt: { $gte: weekAgo },
    });

    // Get top performing links
    const topLinks = await Url.find({ userId })
      .sort({ clickCount: -1 })
      .limit(5)
      .select("shortCode longUrl clickCount createdAt");

    // Get recent activity
    const recentActivity = await Analytics.find({ userId })
      .sort({ clickedAt: -1 })
      .limit(10)
      .populate("shortCode", "shortCode longUrl")
      .select("clickedAt device country city");

    successResponse(
      res,
      {
        totalLinks,
        totalClicks: totalClicks[0]?.total || 0,
        clicksToday,
        clicksThisWeek,
        topLinks,
        recentActivity,
      },
      "Dashboard statistics retrieved successfully"
    );
  } catch (error:any) {
    errorResponse(
      res,
      ERROR_CODES.SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
      error.message,
      500
    );
  }
};

// Get link-specific analytics
export const getLinkAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { shortCode } = req.params;
    const { period = "7d" } = req.query;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    // Verify link belongs to user
    const link = await Url.findOne({ shortCode, userId });
    if (!link) {
      return errorResponse(
        res,
        ERROR_CODES.URL_NOT_FOUND,
        ERROR_MESSAGES.URL_NOT_FOUND,
        null,
        404
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "1d":
        startDate.setDate(now.getDate() - 1);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get analytics data
    const analytics = await Analytics.find({
      shortCode,
      userId,
      clickedAt: { $gte: startDate },
    }).sort({ clickedAt: -1 });

    // Get device breakdown
    const deviceBreakdown = await Analytics.aggregate([
      { $match: { shortCode, userId, clickedAt: { $gte: startDate } } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
    ]);

    // Get country breakdown
    const countryBreakdown = await Analytics.aggregate([
      { $match: { shortCode, userId, clickedAt: { $gte: startDate } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    successResponse(
      res,
      {
        link: {
          shortCode: link.shortCode,
          longUrl: link.longUrl,
          clickCount: link.clickCount,
          uniqueClicks: link.uniqueClicks,
        },
        analytics,
        deviceBreakdown,
        countryBreakdown,
        period,
      },
      "Link analytics retrieved successfully"
    );
  } catch (error:any) {
    errorResponse(
      res,
      ERROR_CODES.SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR,
      error.message,
      500
    );
  }
};
