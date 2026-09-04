import mongoose from "mongoose";
import Specialities, { type SpecialtySlug } from "../models/specialitiesModel.js";
import type { Request, Response } from "express";

export interface IQuery {
  _id?: string;
  slug?: SpecialtySlug;
}
export async function createSpeciality(req: Request, res: Response) {
  try {
    const { slug, name, category, tagline, description, approach, icon } =
      req.body as {
        slug: SpecialtySlug;
        name: string;
        category:
          | "Maternal Health"
          | "Physical Therapy"
          | "Specialized Medicine"
          | "Infectious Diseases";
        tagline: string;
        description: string;
        approach: string[];
        icon: string;
      };

    if (!slug || !name || !category || !tagline || !description || !approach) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await Specialities.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Speciality already exists" });
    }

    const speciality = await Specialities.create({
      slug,
      name,
      category,
      tagline,
      description,
      approach,
      icon
    });

    return res.status(201).json({
      message: "Speciality created successfully",
      speciality,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getSpecialities(req: Request, res: Response) {
  try {
    const specialities = await Specialities.find().sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Specialities retrieved successfully",
      specialities,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getSpeciality(req: Request, res: Response) {
  try {
    const { identifier } = req.params as { identifier: string };

    if (!identifier) {
      return res.status(400).json({ message: "Identifier is required" });
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

    const query = isObjectId
      ? { $or: [{ _id: identifier }, { slug: identifier as SpecialtySlug }] }
      : { slug: identifier as SpecialtySlug };

    const speciality = await Specialities.findOne(query);

    if (!speciality) {
      return res.status(404).json({ message: "Speciality not found" });
    }

    return res
      .status(200)
      .json({ message: "Speciality retrieved successfully", speciality });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function updateSpeciality(req: Request, res: Response) {
  try {
    const { id } = req.params as {
      id: string;
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Id format" });
    }

    const speciality = await Specialities.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!speciality) {
      return res.status(404).json({ message: "Speciality not found" });
    }

    return res.status(200).json({
      message: "Speciality updated successfully",
      speciality,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function deleteSpeciality(req: Request, res: Response) {
  try {
    const { id } = req.params as {
      id: string;
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Id format" });
    }

    const speciality = await Specialities.findByIdAndDelete(id);

    if (!speciality) {
      return res.status(404).json({ message: "Speciality not found" });
    }

    return res.status(200).json({ message: "Speciality deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export default {
  createSpeciality,
  getSpecialities,
  getSpeciality,
  updateSpeciality,
  deleteSpeciality,
};
