import mongoose, { Schema, Model, Document } from "mongoose";

export type UserRole = "patient" | "practitioner" | "admin";
export type UserGender = "male" | "female" | "other";

// 1. Define an interface for the nested address structure
export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface IUSER extends Document {
  fullName: string;
  email: string;
  phoneNumber?: string;
  gender?: UserGender;
  passwordHash: string;
  role: UserRole;
  isSuspended: boolean; 
  suspensionReason?: string;
  avatar?: string; 
  address?: IAddress; 
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUSER> = new Schema<IUSER>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["patient", "practitioner", "admin"],
      default: "patient",
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspensionReason: {
      type: String,
      trim: true,
      default: "",
    },

    // 4. Added avatar field configuration
    avatar: {
      type: String,
      default: "", // Default to an empty string, or a placeholder image URL
    },

    // 5. Added structured address field configuration
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  },
);

export const User: Model<IUSER> = mongoose.models.User || mongoose.model<IUSER>("User", UserSchema);

export default User;