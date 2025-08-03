import { log } from "console";
import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("mongodb connected");
  } catch (err) {
    console.log("connection failed", err);
    process.exit(1);
  }
};
