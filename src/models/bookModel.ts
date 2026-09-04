import mongoose, { Schema, Model, Document, Types } from "mongoose";
import type { SpecialtySlug } from "./specialitiesModel.js";

export interface IBook extends Document {
  patient: Types.ObjectId;
  specialty: SpecialtySlug;
  date: string;
  time: string;
  type: "In-person" | "Virtual";
  status: "Pending" | "Approved" | "Completed" | "Rejected" | "Cancelled";
  symptoms?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema: Schema<IBook> = new Schema<IBook>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    specialty: {
      type: String,
      required: true,
      enum: [
        "anti-natal",
        "post-natal",
        "labor-and-delivery",
        "stroke-recovery",
        "bone-setting",
        "infertility",
        "infection-treatment",
        "general-tradomedical-care"
      ],
    },

    date: {
      type: String,
      required: true,
      trim: true,
    },

    time: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["In-person", "Virtual"],
      default: "In-person",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Completed", "Rejected", "Cancelled"],
      default: "Pending",
    },

    symptoms: {
      type: String,
      trim: true,
      default: "",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
  },

  {
    timestamps: true,
  },
);

export const Book: Model<IBook> =
  mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

export default Book;
