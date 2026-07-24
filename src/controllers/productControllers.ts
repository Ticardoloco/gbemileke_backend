import { Request, Response } from "express";
import Product from "../models/productModel.js";
import { SpecialtySlug } from "../models/specialitiesModel.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Admin / Practitioner)
 */

export async function createProduct(req: Request, res: Response) {
  try {
    const { name, category, price, stock, description, usage } = req.body as {
      name: string;
      category: SpecialtySlug;
      price: number;
      stock: number;
      description: string;
      usage: string;
    };

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Product image file is required" });
    }

    if (!name || !category || price === undefined || !description || !usage) {
      return res.status(400).json({ message: "Missing required text fields" });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, "products");

    const product = await Product.create({
      name,
      category,
      image: imageUrl,
      price: Number(price),
      stock: stock !== undefined ? Number(stock) : 0,
      description,
      usage,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

/**
 * @desc    Get all products (with optional filtering, search, and pagination)
 * @route   GET /api/products
 * @access  Public
 */
export async function getProducts(req: Request, res: Response) {
  try {
    const {
      category,
      search,
      page = "1",
      limit = "10",
    } = req.query as {
      category?: SpecialtySlug;
      search?: string;
      page?: string;
      limit?: string;
    };

    
    const query: Record<string, any> = {};

    if (category) {
      query.category = category;
    }

    if (search) {
     const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: escapedSearch, $options: "i" };
    }

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [products, totalProducts] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      message: "Products retrieved successfully",
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limitNumber),
      currentPage: pageNumber,
      products,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

/**
 * @desc    Update a product by ID (Supports optional new image upload)
 * @route   PUT /api/products/:id
 * @access  Private (Admin / Practitioner)
 */

export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    const updateData: Record<string, any> = { ...req.body };

    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file.buffer, "products");
      updateData.image = imageUrl;
    }

    if (updateData.price !== undefined)
      updateData.price = Number(updateData.price);
    if (updateData.stock !== undefined)
      updateData.stock = Number(updateData.stock);

    const updateProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true },
    );

    if (!updateProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product: updateProduct,
    });
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message, error });
    }
    return res.status(500).json({ message: "Internal server error", error });
  }
}


/**
 * @desc    Delete a product by ID
 * @route   DELETE /api/products/:id
 * @access  Private (Admin / Practitioner)
 */

export async function deleteProduct(req: Request, res: Response) {
    try {
        const {id} = req.params as {id: string};

        if (!mongoose.Types.ObjectId.isValid(id)) {
           return res.status(400).json({message: "Invalid product ID format"});
        }

        const deleteProduct = await Product.findByIdAndDelete(id);

        if (!deleteProduct) {
           return res.status(404).json({message: "Product not found"});
        }

        return res.status(200).json({
            message: "Product deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
}

export default {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct
}

