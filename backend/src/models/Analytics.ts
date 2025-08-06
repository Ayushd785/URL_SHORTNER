import mongoose from "mongoose";
import { Document } from "mongodb";

export interface IAnalytics extends Document {
  shortCode: string;
  userId: mongoose.Schema.Types.ObjectId;
  clickedAt: Date;
  ipAddress: string;
  userAgent: string;
  country?: string;
  city?: string;
  device: "desktop" | "mobile" | "tablet";
  browser?: string;
  os?: string;
  referrer?: string;
  isUnique: boolean;
}

const analyticsSchema = new mongoose.Schema<IAnalytics>(
  {
    shortCode: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clickedAt: {
      type: Date,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet"],
      default: "desktop",
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    referrer: {
      type: String,
    },
    isUnique: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

analyticsSchema.index({ shortCode: 1, clickedAt: -1 });
analyticsSchema.index({ userId: 1, clickedAt: -1 });
analyticsSchema.index({ ipAddress: 1, shortCode: 1 });

export const Analytics = mongoose.model<IAnalytics>(
  "Analytics",
  analyticsSchema
);
