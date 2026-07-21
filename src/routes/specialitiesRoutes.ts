import { Router } from "express";
import {
  createSpeciality,
  getSpecialities,
  getSpeciality,
  updateSpeciality,
  deleteSpeciality,
} from "../controllers/specialitiesControllers.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Hospital Specialities
 *   description: Medical specialties management and lookup for Gbemileke Tradomedical Hospital
 */

// ==========================================
// PUBLIC ROUTES
// ==========================================

/**
 * @openapi
 * /api/specialities:
 *   get:
 *     summary: Retrieve list of all hospital specialties
 *     tags: [Hospital Specialities]
 *     responses:
 *       200:
 *         description: List of specialties retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", getSpecialities);

/**
 * @openapi
 * /api/specialities/{identifier}:
 *   get:
 *     summary: Get a single specialty by ID or slug
 *     tags: [Hospital Specialities]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Can be either a 24-character MongoDB ObjectId or a specialty slug (e.g., "antenatal")
 *         example: "antenatal"
 *     responses:
 *       200:
 *         description: Specialty retrieved successfully
 *       400:
 *         description: Identifier is required
 *       404:
 *         description: Specialty not found
 *       500:
 *         description: Internal server error
 */
router.get("/:identifier", getSpeciality);

// ==========================================
// PROTECTED / ADMIN ROUTES (Requires valid Bearer Token)
// ==========================================

/**
 * @openapi
 * /api/specialities:
 *   post:
 *     summary: Create a new medical specialty
 *     tags: [Hospital Specialities]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug, name, category, tagline, description, approach]
 *             properties:
 *               slug:
 *                 type: string
 *                 enum: ["anti-natal", "post-natal", "labor-and-delivery", "stroke-recovery", "bone-setting", "infertility", "infection"]
 *                 example: "anti-natal"
 *               name:
 *                 type: string
 *                 example: "Antenatal Care"
 *               category:
 *                 type: string
 *                 enum: ["Maternal Health", "Physical Therapy", "Specialized Medicine", "Infectious Diseases"]
 *                 example: "Maternal Health"
 *               tagline:
 *                 type: string
 *                 example: "Comprehensive prenatal care for expecting mothers"
 *               description:
 *                 type: string
 *                 example: "Holistic care combining traditional and modern practices throughout pregnancy."
 *               approach:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Nutritional guidance", "Herbal therapy", "Routine checkups"]
 *               icon:
 *                 type: string
 *                 example: "baby-icon"
 *     responses:
 *       201:
 *         description: Specialty created successfully
 *       400:
 *         description: Missing required fields or specialty already exists
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Internal server error
 */
router.post("/", protect, createSpeciality);

/**
 * @openapi
 * /api/specialities/{id}:
 *   put:
 *     summary: Update an existing specialty by ID
 *     tags: [Hospital Specialities]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the specialty to update
 *         example: "65a123456789abcdef123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Updated Specialty Name" }
 *               tagline: { type: string, example: "Updated tagline text" }
 *               description: { type: string, example: "Updated description text" }
 *               approach:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Updated step 1", "Updated step 2"]
 *               icon: { type: string, example: "new-icon" }
 *     responses:
 *       200:
 *         description: Specialty updated successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Specialty not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", protect, updateSpeciality);

/**
 * @openapi
 * /api/specialities/{id}:
 *   delete:
 *     summary: Delete a specialty by ID
 *     tags: [Hospital Specialities]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the specialty to delete
 *         example: "65a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Specialty deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Specialty not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", protect, deleteSpeciality);

export default router;