import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  getUserProfiles,
  updateUserProfile,
  deleteUserProfile,
  updateUserRole,
} from "../controllers/userControllers.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import { upload } from "../utils/cloudinary.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Authentication & Users
 *   description: User accounts, profile management, and role lookups for Gbemileke Tradomedical Hospital
 */

// ==========================================
// PUBLIC ROUTES
// ==========================================

/**
 * @openapi
 * /api/user/register:
 *   post:
 *     summary: Register a new patient, practitioner, or admin
 *     tags: [Authentication & Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName: { type: string, example: "Alabi Gbemileke" }
 *               email: { type: string, format: email, example: "alabi@gbemileke.com" }
 *               password: { type: string, example: "SecurePassword123" }
 *               gender: { type: string, enum: [male, female, other], example: "male", description: "Optional gender field" }
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing fields or user already registered
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/register", registerUser);

/**
 * @openapi
 * /api/user/login:
 *   post:
 *     summary: User login to generate access token
 *     tags: [Authentication & Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "alabi@gbemileke.com" }
 *               password: { type: string, example: "SecurePassword123" }
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Invalid credentials
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", loginUser);

/**
 * @openapi
 * /api/user/logout:
 *   post:
 *     summary: Log out user session
 *     tags: [Authentication & Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: "alabi@gbemileke.com" }
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: User not found
 */
router.post("/logout", logoutUser);

// ==========================================
// PROTECTED ROUTES (Requires valid Bearer Token)
// ==========================================

/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     summary: View current logged in user profile
 *     tags: [Authentication & Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details retrieved
 *       401:
 *         description: Not authorized, missing or invalid token
 */
router.get("/profile", protect, getUserProfile);

/**
 * @openapi
 * /api/user/profile:
 *   put:
 *     summary: Update profile fields and/or upload avatar image to Cloudinary
 *     tags: [Authentication & Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: "Dr. Alabi Gbemileke" }
 *               phoneNumber: { type: string, example: "+2348012345678" }
 *               gender: { type: string, enum: [male, female, other], example: "male" }
 *               avatar: { type: string, format: binary, description: "Upload raw image file" }
 *               address: { type: string, description: "Stringified JSON object. e.g. {\"city\":\"Lagos\",\"country\":\"Nigeria\"}" }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid gender or address format payload
 *       401:
 *         description: Not authorized
 */
router.put("/profile", protect, upload.single("avatar"), updateUserProfile);

/**
 * @openapi
 * /api/user/profile:
 *   delete:
 *     summary: Permanently delete your own user profile account
 *     tags: [Authentication & Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Your profile and associated storage assets have been successfully deleted."
 *                 actionRequired:
 *                   type: string
 *                   example: "CLEAR_LOCAL_AUTH_TOKENS"
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User record not found
 *       500:
 *         description: Internal Server Error
 */
router.delete("/profile", protect, deleteUserProfile);

/**
 * @openapi
 * /api/user/{id}/role:
 *   patch:
 *     summary: Update user role by ID (Admin only)
 *     tags: [Authentication & Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User MongoDB ID
 *         example: "6a60e167d67256bf168fdec5"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [patient, practitioner, admin]
 *                 example: "practitioner"
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role provided
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Admin role)
 *       404:
 *         description: User record not found
 *       500:
 *         description: Internal Server Error
 */
router.patch("/:id/role", protect, authorize("admin"), updateUserRole);

/**
 * @openapi
 * /api/user:
 *   get:
 *     summary: Retrieve list of all hospital users (Protected)
 *     tags: [Authentication & Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Directory list retrieved successfully
 *       401:
 *         description: Not authorized
 */
router.get("/", protect, getUserProfiles);

export default router;
