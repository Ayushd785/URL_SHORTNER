import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  firstname: string;
  lastname: string;
  avatar?: string;
  plan: string;
  preferences?: {
    emailNotifications: boolean;
    clickTracking: boolean;
    publicProfile: boolean;
    twoFactorAuth: boolean;
  };
  lastLogin: Date;
  isActive: boolean;
  email: string;
  password: string;
  googleId?: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      required: true,
      default:
        "https://sm.ign.com/t/ign_pk/cover/a/avatar-gen/avatar-generations_rpge.600.jpg",
    },
    plan: {
      type: String,
      required: true,
      enum: ["free", "pro"],
      default: "free",
    },

    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      clickTracking: {
        type: Boolean,
        default: true,
      },
      publicProfile: {
        type: Boolean,
        default: false,
      },
      twoFactorAuth: {
        type: Boolean,
        default: true,
      },
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
