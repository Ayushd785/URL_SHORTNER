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


export const getDetailedAnalytics = async(req: AuthRequest, res: Response)=>{
  try {
    const userId = req.userId;
    const { period = "30d" } = req.query;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "id":
        startDate.setDate(now.getDate() - 1);
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const clickTrends = await Analytics.aggregate([
      {
        $match: {
          userId: userId,
          clickedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$clickedAt" },
            month: { $month: "$clickedAt" },
            day: { $dayOfMonth: "$clickedAt" },
          },
          totalClicks: { $sum: 1 },
          uniqueClicks: {
            $sum: { $cond: ["$isUnique", 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const deviceStats = await Analytics.aggregate([
      { $match: { userId: userId, clickedAt: { $gte: startDate } } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const browserStats = await Analytics.aggregate([
      { $match: { userId: userId, clickedAt: { $gte: startDate } } },
      { $group: { _id: "$browser", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const countryStats = await Analytics.aggregate([
      { $match: { userId: userId, clickedAt: { $gte: startDate } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    const referrerStats = await Analytics.aggregate([
      { $match: { userId: userId, clickedAt: { $gte: startDate } } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const hourlyPattern = await Analytics.aggregate([
      { $match: { userId: userId, clickedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: "$clickedAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    successResponse(
      res,
      {
        period,
        dateRange: { startDate, endDate: now },
        clickTrends,
        deviceStats,
        browserStats,
        countryStats,
        referrerStats,
        hourlyPattern,
      },
      "Detailed analytics retrieved successfully"
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
}

export const getRealTimeAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      );
    }

    // Get recent clicks (last 24 hours)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentClicks = await Analytics.find({
      userId,
      clickedAt: { $gte: last24Hours },
    })
      .sort({ clickedAt: -1 })
      .limit(Number(limit))
      .populate("shortCode", "shortCode longUrl description")
      .select("clickedAt device browser country city referrer isUnique");

    // Get clicks in last hour
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    const clicksLastHour = await Analytics.countDocuments({
      userId,
      clickedAt: { $gte: lastHour },
    });

    // Get active countries in last 24 hours
    const activeCountries = await Analytics.aggregate([
      { $match: { userId: userId, clickedAt: { $gte: last24Hours } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    successResponse(
      res,
      {
        recentClicks,
        clicksLastHour,
        activeCountries,
        lastUpdated: new Date(),
      },
      "Real-time analytics retrieved successfully"
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

