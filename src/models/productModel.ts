import mongoose, {Schema, Model, Document} from "mongoose";
import { SpecialtySlug } from "./specialitiesModel.js";

export interface IProduct extends Document {
    name: string;
    category: SpecialtySlug;
    image: string;
    price: number;
    stock: number;
    description: string;
    usage: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema<IProduct> (
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true
        },

        category: {
            type: String,
            required: [true, "Category is required"],
            enum: ["anti-natal", "post-natal", "labor-and-delivery", "stroke-recovery", "bone-setting", "infertility", "infection-treatment", "low-sperm-count"],
        },

        image: {
            type: String,
            required: [true, "Product image URL is required"],
        },

        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price must not be less than 0"]
        },
        
        stock: {
            type: Number,
            default: 0,
            min: [0, "Stock must not be less than 0"]
        },

        description: {
            type: String, 
            required: [true, "Description is required"],
            trim: true,
        },
        usage: {
            type: String, 
            required: [true, "Usage instructions are required"],
            trim: true,
        },


    },

    {
        timestamps: true,
    }
);

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;