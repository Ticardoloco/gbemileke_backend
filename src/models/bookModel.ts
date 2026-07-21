import mongoose, {Schema, Model, Document, Types} from "mongoose";
import { SpecialtySlug } from "./specialitiesModel";


export interface IBook extends Document {
  patient: Types.ObjectId;
  specialty: SpecialtySlug;
  date: string;
  time: string;
  type: "In-person" | "Virtual";
  status: "Pending" | "Approved" | "Completed" | "Cancelled";
  symptoms?: string;
  createdAt: Date;
  updatedAt: Date;
};

const BookSchema: Schema<IBook> = new Schema<IBook> (
    {
        patient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        specialty: {
            type: String,
            required: true,
            enum: ["anti-natal", "post-natal", "labor-and-delivery", "stroke-recovery", "bone-setting", "infertility", "infection-treatment"]
        },

        date: {
            type: String,
            required: true,
            trim: true
        },

        time: {
            type: String,
            required: true,
            trim: true
        },

        type: {
            type: String,
            enum: ["In-person", "Virtual"],
            default: "In-person"
        },

        status:{
            type: String,
            enum: ["Pending", "Approved", "Completed", "Cancelled"],
            default: "Pending"
        },

        symptoms: {
            type: String,
            trim: true,
            default: ""
        }

    },

    {
        timestamps: true
    }
)

export const Book: Model<IBook> = mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);

export default Book;