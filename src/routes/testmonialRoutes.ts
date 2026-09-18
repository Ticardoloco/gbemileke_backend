import { Router } from "express";
import { authorize, protect } from "../middleware/authMiddleware.js";
import {
  createTestimonial,
  getApprovedTestimonials,
  getAllTestimonials,
  toggleApproveTestimonial,
  toggleFeatureTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialControllers.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Testimonials
 *   description: Patient feedback and testimonial management endpoints
 */

// ==========================================
// PUBLIC & CLIENT ROUTES
// ==========================================

/**
 * @openapi
 * /api/testimonials:
 *   post:
 *     summary: Submit a new testimonial (Pending admin approval)
 *     tags: [Testimonials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - care
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Mrs. Blessing Adebayo"
 *               care:
 *                 type: string
 *                 enum:
 *                   - anti-natal
 *                   - post-natal
 *                   - labor-and-delivery
 *                   - stroke-recovery
 *                   - bone-setting
 *                   - infertility
 *                   - infection-treatment
 *                   - general-tradomedical-care
 *                 example: "anti-natal"
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "The care I received during my pregnancy was top-notch."
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 5
 *                 example: 5
 *     responses:
 *       201:
 *         description: Testimonial submitted successfully for admin review
 *       400:
 *         description: Missing required fields or validation error
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Retrieve all approved testimonials for public display
 *     tags: [Testimonials]
 *     responses:
 *       200:
 *         description: List of approved testimonials retrieved successfully
 *       500:
 *         description: Internal server error
 */
router
  .route("/")
  .post(createTestimonial)
  .get(getApprovedTestimonials);

// ==========================================
// ADMIN-ONLY MANAGEMENT ROUTES
// ==========================================

/**
 * @openapi
 * /api/testimonials/admin/all:
 *   get:
 *     summary: Retrieve all testimonials including pending ones (Admin Only)
 *     tags: [Testimonials]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Complete testimonials directory retrieved
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Admin role)
 *       500:
 *         description: Internal server error
 */
router.get(
  "/admin/all",
  protect,
  authorize("admin"),
  getAllTestimonials
);

/**
 * @openapi
 * /api/testimonials/{id}:
 *   delete:
 *     summary: Delete a testimonial by ID (Admin Only)
 *     tags: [Testimonials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the testimonial
 *         example: "65a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Testimonial deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Admin role)
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", protect, authorize("admin"), deleteTestimonial);

/**
 * @openapi
 * /api/testimonials/{id}/approve:
 *   patch:
 *     summary: Approve or unapprove a testimonial (Admin Only)
 *     tags: [Testimonials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the testimonial
 *         example: "65a123456789abcdef123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isApproved
 *             properties:
 *               isApproved:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Approval status updated successfully
 *       400:
 *         description: Invalid status flag format
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Admin role)
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/approve", protect, authorize("admin"), toggleApproveTestimonial);

/**
 * @openapi
 * /api/testimonials/{id}/feature:
 *   patch:
 *     summary: Set testimonial featured status for homepage banner (Admin Only)
 *     tags: [Testimonials]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the testimonial
 *         example: "65a123456789abcdef123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isFeatured
 *             properties:
 *               isFeatured:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Featured status updated successfully
 *       400:
 *         description: Invalid featured flag format
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Admin role)
 *       404:
 *         description: Testimonial not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/feature", protect, authorize("admin"), toggleFeatureTestimonial);

export default router;