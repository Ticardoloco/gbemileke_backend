import mongoose, { Schema, Model, Document, Types } from "mongoose";
import type { SpecialtySlug } from "./specialitiesModel.js";

export interface ITestimonials extends Document {
  name: string;
  care: SpecialtySlug;
  message: string;
  isApproved: boolean;
  isFeatured?: boolean;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema: Schema<ITestimonials> = new Schema<ITestimonials>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },

  care: {
    type: String,
    required: [true, "Care specialty is required"],
    enum: [
        "anti-natal",
        "post-natal",
        "labor-and-delivery",
        "stroke-recovery",
        "bone-setting",
        "infertility",
        "infection-treatment",
        "male-fertility-care",
        "general-tradomedical-care",
      ],
  },

  message: {
    type: String,
    required: [true, "Testimonial message is required"],
    trim: true,
    maxlength: [1000, "Message cannot exceed 1000 characters"],
  },

  isApproved: {
    type: Boolean,
    default: false,
    index: true,
  },

  isFeatured: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
},
{
    timestamps: true,
}
);

TestimonialSchema.index({ isApproved: 1, createdAt: -1 });


export const Testimonials: Model<ITestimonials> = mongoose.models.Testimonials || mongoose.model<ITestimonials>("Testimonials", TestimonialSchema);


