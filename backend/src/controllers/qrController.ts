import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import QRCode from "qrcode";
import { errorResponse, successResponse } from "../utils/apiResponse";
import { ERROR_CODES, ERROR_MESSAGES } from "../constants/errorCodes";
import { Url } from "../models/Url";

export const generateQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { shortCode } = req.params;
    const { size = 200, format = "png" } = req.query;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    const url = await Url.findOne({ shortCode, userId });

    if (!url) {
      return errorResponse(
        res,
        ERROR_CODES.URL_NOT_FOUND,
        ERROR_MESSAGES.URL_NOT_FOUND,
        null,
        404
      );
    }

    const baseUrl = process.env.BASE_URL || "http://35.154.143.129:8080";

    const shortUrl = `${baseUrl}/${shortCode}`;

    // generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(shortUrl, {
      width: Number(size),
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    successResponse(
      res,
      {
        qrCode: qrCodeDataURL,
        shortUrl,
        shortCode,
        size: Number(size),
        format,
      },
      "QR code generated successfully"
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

// download QR code as image

export const downloadQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { shortCode } = req.params;
    const { format = "png" } = req.query;

    if (!userId) {
      return errorResponse(
        res,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    const url = await Url.findOne({ shortCode, userId });
    if (!url) {
      return errorResponse(
        res,
        ERROR_CODES.URL_NOT_FOUND,
        ERROR_MESSAGES.URL_NOT_FOUND,
        null,
        404
      );
    }

    const baseUrl = process.env.BASE_URL;
    const shortUrl = `${baseUrl}/${shortCode}`;

    const qrCodeBuffer = await QRCode.toBuffer(shortUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    res.setHeader("Content-Type", `image/${format}`);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="qr-${shortCode}.${format}"`
    );
    res.setHeader("Content-Length", qrCodeBuffer.length);

    res.send(qrCodeBuffer);
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

// generate custom qr code

export const generateCustomQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const {
      shortCode,
      size = 200,
      format = "png",
      foregroundColor = "#000000",
      backgroundColor = "#FFFFFF",
      margin = 2,
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

    // Verify link belongs to user
    const url = await Url.findOne({ shortCode, userId });
    if (!url) {
      return errorResponse(
        res,
        ERROR_CODES.URL_NOT_FOUND,
        ERROR_MESSAGES.URL_NOT_FOUND,
        null,
        404
      );
    }

    // Generate short URL
    const baseUrl = process.env.BASE_URL || "http://35.154.143.129:8080";
    const shortUrl = `${baseUrl}/${shortCode}`;

    // Generate custom QR code
    const qrCodeDataURL = await QRCode.toDataURL(shortUrl, {
      width: Number(size),
      margin: Number(margin),
      color: {
        dark: foregroundColor,
        light: backgroundColor,
      },
    });

    successResponse(
      res,
      {
        qrCode: qrCodeDataURL,
        shortUrl,
        shortCode,
        options: {
          size: Number(size),
          format,
          foregroundColor,
          backgroundColor,
          margin: Number(margin),
        },
      },
      "Custom QR code generated successfully"
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
