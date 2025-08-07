import mongoose, { Document } from "mongoose";
import { User } from "./User";

export interface IUrl extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  longUrl: string;
  shortCode: string;
  clickCount: number;
  password?: string;
  createdAt: Date;
  description?: string;
  customAlias?: string;
  uniqueClicks: number;
  expiresAt?: Date;
  isActive: boolean;
  category?: string;
  lastClickedAt?: Date;
  updatedAt: Date;
}

const urlSchema = new mongoose.Schema<IUrl>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    longUrl: {
      type: String,
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      required: false,
    },
    uniqueClicks: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      maxlength: 100,
    },
    lastClickedAt: {
      type: Date,
    },
    customAlias: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

urlSchema.index({ userId: 1, createdAt: -1 });
urlSchema.index({ shortCode: 1 });
urlSchema.index({ customAlias: 1 });
urlSchema.index({ isActive: 1 });

export const Url = mongoose.model<IUrl>("Url", urlSchema);
