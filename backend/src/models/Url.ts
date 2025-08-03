import mongoose, { Document } from "mongoose";
import { User } from "./User";

export interface IUrl extends Document {
  userId: String;
  longUrl: string;
  shortCode: string;
  clickCount: number;
  password?: string;
  createdAt: Date;
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
  },
  { timestamps: true }
);

export const Url = mongoose.model<IUrl>("Url", urlSchema);
