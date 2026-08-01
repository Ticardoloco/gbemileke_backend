import mongoose, { Schema, Model, Document } from "mongoose";

export type SpecialtySlug =
  | "anti-natal"
  | "post-natal"
  | "labor-and-delivery"
  | "stroke-recovery"
  | "bone-setting"
  | "infertility"
  | "infection-treatment"
  | "male-fertility-care";

export interface ISpecialities extends Document {
  slug: SpecialtySlug;
  name: string;
  category: "Maternal Health" | "Physical Therapy" | "Specialized Medicine" | "Infectious Diseases";
  tagline: string;
  description: string;
  approach: string[];
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialitySchema: Schema<ISpecialities> = new Schema<ISpecialities> (
    {
        slug:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            enum: [ "anti-natal", "post-natal", "labor-and-delivery", "stroke-recovery", "bone-setting", "infertility", "infection-treatment", "male-fertility-care"],
        },

        name:{
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        category: {
            type: String,
            required: true,
            enum: ["Maternal Health", "Physical Therapy", "Specialized Medicine", "Infectious Diseases"],
        },

        tagline:{
            type: String,
            required: true,
            trim: true,
        },

        description:{
            type: String,
            required: true,
            trim: true,
        },

        approach: {
            type: [String],
            required: true,
            default: []
        },
        
        icon: {
            type: String,
            trim: true
        }

    },

    {
        timestamps: true
    }
)

export const Specialities: Model<ISpecialities> = mongoose.models.Specialities || mongoose.model<ISpecialities>("Specialities", SpecialitySchema);
export default Specialities;