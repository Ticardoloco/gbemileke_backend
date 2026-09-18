import { count } from "node:console";
import type { SpecialtySlug } from "../models/specialitiesModel.js";
import { Testimonials } from "../models/testimonialModel.js";
import type {Request, Response} from 'express';

/**
 * @desc    Submit a new testimonial (Public)
 * @route   POST /api/testimonials
 * @access  Public
 */
export async function createTestimonial(req: Request, res: Response) {
    try {
       const {name, care, message, rating} = req.body as {name: string; care: SpecialtySlug; message: string; rating: number;} 

       if (!name || !care || !message || !rating){
        return res.status(400).json({message: "Name, care specialty, and message are required fields."});
       }

       const testimonial = await Testimonials.create({
        name,
        care,
        message,
        rating: rating ? Number(rating) : 5,
        isApproved: false,
        isFeatured: false,
       })

       return res.status(200).json({
        message: "Thank you! Your testimonial has been submitted for review.",
        testimonial
       })
    } catch (error: any) {
        return res.status(500).json({
      message: "Failed to submit testimonial.",
      error: error.message || error,
    });
    }
}


/**
 * @desc    Get all APPROVED testimonials for client UI
 * @route   GET /api/testimonials
 * @access  Public
 */

export async function getApprovedTestimonials(req: Request, res: Response) {
    try {
        const testimonials = await Testimonials.find({isApproved: true}).sort({createdAt: -1}).lean();

        return res.status(200).json({
            message: "Approved testimonials retrieved successfully",
            count: testimonials.length,
            testimonials
        });
    } catch (error: any) {
        return res.status(500).json({
      message: "Failed to retrieve testimonials.",
      error: error.message || error,
    });
    }
}


/**
 * @desc    Get all testimonials including pending approval (Admin Only)
 * @route   GET /api/testimonials/admin/all
 * @access  Private/Admin
 */

export async function getAllTestimonials(req: Request, res: Response) {
    try {
        const testimonials = await Testimonials.find().sort({createdAt: -1}).lean();

        return res.status(200).json({
            message: "All testimonials retrieved successfully",
            count: testimonials.length,
            testimonials,
        })


    } catch (error: any) {
        return res.status(500).json({
      message: "Failed to retrieve testimonials directory.",
      error: error.message || error,
    });
    }
}

/**
 * @desc    Approve or Unapprove a testimonial (Admin Only)
 * @route   PATCH /api/testimonials/:id/approve
 * @access  Private/Admin
 */

export async function toggleApproveTestimonial(req: Request, res: Response) {
    try {
        const {id} = req.params as {id: string};
        const {isApproved} = req.body as {isApproved: boolean;};

        if (typeof isApproved !== "boolean") {
            return res.status(400).json({
                message: "The 'isApproved' boolean field is required.",
            });
        }

        const  updatedTestimonial = await Testimonials.findByIdAndUpdate(
            id,
            {$set: {isApproved}},
            {returnDocument: "after", runValidators: true}
        );

        if(!updatedTestimonial){
            return res.status(404).json({message: "Testimonial not found."});
        }

        const statusText = isApproved ? "approved" : "unapproved";

        return res.status(200).json({
            message: `Testimonial has been successfully ${statusText}.`,
            Testimonial: updatedTestimonial, 
        })
    } catch (error: any) {
        return res.status(500).json({
      message: "Failed to update approval status.",
      error: error.message || error,
    });
    }
}


/**
 * @desc    Feature/Unfeature a testimonial for homepage banner (Admin Only)
 * @route   PATCH /api/testimonials/:id/feature
 * @access  Private/Admin
 */

export async function toggleFeatureTestimonial(req: Request, res: Response) {
    try {
        const {id} = req.params as { id: string};
        const {isFeatured} = req.body as {isFeatured: boolean;}

        if(typeof isFeatured !== "boolean"){
            return res.status(400).json({message: "The 'isFeatured' boolean field is required."})
        }

        const updatedTestimonial = await Testimonials.findByIdAndUpdate(
            id,
           { $set: {isFeatured} },
           {returnDocument: "after", runValidators: true}
        );

        if (!updatedTestimonial) {
      return res.status(404).json({ message: "Testimonial not found." });
    }

    return res.status(200).json({
      message: `Testimonial featured status set to ${isFeatured}.`,
      testimonial: updatedTestimonial,
    });
    
    } catch (error: any) {
        return res.status(500).json({
      message: "Failed to update featured status.",
      error: error.message || error,
    });
    }
}

/**
 * @desc    Delete a testimonial (Admin Only)
 * @route   DELETE /api/testimonials/:id
 * @access  Private/Admin
 */

export async function deleteTestimonial(req: Request, res: Response) {
    try {
        const {id} = req.params as {id: string};
        const testimonial = await Testimonials.findByIdAndDelete(id);

        if (!testimonial) {
            return res.status(404).json({ message: "Testimonial not found." });
        }

        return res.status(200).json({
      message: "Testimonial deleted successfully.",
    });
    } catch (error:any) {
        return res.status(500).json({
      message: "Failed to delete testimonial.",
      error: error.message || error,
    });
    }
}

export default {
  createTestimonial,
  getApprovedTestimonials,
  getAllTestimonials,
  toggleApproveTestimonial,
  toggleFeatureTestimonial,
  deleteTestimonial,
};