// import { Router } from "express";
// import {
//   registerUser,
//   loginUser,
//   logoutUser,
//   getUserProfile,
//   getUserProfiles,
//   updateUserProfile,
//   deleteUserProfile,
//   updateUserRole,
//   suspendUser,
//   changePassword,
// } from "../controllers/userControllers.js";
// import { authorize, protect } from "../middleware/authMiddleware.js";
// import { upload } from "../utils/cloudinary.js";

// const router = Router();

// /**
//  * @openapi
//  * tags:
//  *   name: Authentication & Users
//  *   description: User accounts, profile management, and role lookups for Gbemileke Tradomedical Hospital
//  */

// // ==========================================
// // PUBLIC ROUTES
// // ==========================================

// /**
//  * @openapi
//  * /api/user/register:
//  *   post:
//  *     summary: Register a new patient, practitioner, or admin
//  *     tags: [Authentication & Users]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [fullName, email, password]
//  *             properties:
//  *               fullName: { type: string, example: "Alabi Gbemileke" }
//  *               email: { type: string, format: email, example: "alabi@gbemileke.com" }
//  *               password: { type: string, example: "SecurePassword123" }
//  *               gender: { type: string, enum: [male, female, other], example: "male", description: "Optional gender field" }
//  *     responses:
//  *       201:
//  *         description: User created successfully
//  *       400:
//  *         description: Missing fields or user already registered
//  *       500:
//  *         $ref: '#/components/schemas/ErrorResponse'
//  */
// router.post("/register", registerUser);

// /**
//  * @openapi
//  * /api/user/login:
//  *   post:
//  *     summary: User login to generate access token
//  *     tags: [Authentication & Users]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [email, password]
//  *             properties:
//  *               email: { type: string, format: email, example: "alabi@gbemileke.com" }
//  *               password: { type: string, example: "SecurePassword123" }
//  *     responses:
//  *       200:
//  *         description: User logged in successfully
//  *       400:
//  *         description: Invalid credentials
//  *       403:
//  *         description: Account is suspended
//  *       500:
//  *         $ref: '#/components/schemas/ErrorResponse'
//  */
// router.post("/login", loginUser);

// /**
//  * @openapi
//  * /api/user/logout:
//  *   post:
//  *     summary: Log out user session
//  *     tags: [Authentication & Users]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [email]
//  *             properties:
//  *               email: { type: string, format: email, example: "alabi@gbemileke.com" }
//  *     responses:
//  *       200:
//  *         description: User logged out successfully
//  *       400:
//  *         description: User not found
//  */
// router.post("/logout", logoutUser);

// // ==========================================
// // PROTECTED USER ROUTES
// // ==========================================

// /**
//  * @openapi
//  * /api/user/profile:
//  *   get:
//  *     summary: View current logged in user profile
//  *     tags: [Authentication & Users]
//  *     security:
//  *       - BearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Profile details retrieved
//  *       401:
//  *         description: Not authorized, missing or invalid token
//  *       403:
//  *         description: Account is suspended
//  */
// router.get("/profile", protect, getUserProfile);

// /**
//  * @openapi
//  * /api/user/profile:
//  *   put:
//  *     summary: Update profile fields and/or upload avatar image
//  *     tags: [Authentication & Users]
//  *     security:
//  *       - BearerAuth: []
//  *     requestBody:
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               fullName: { type: string, example: "Dr. Alabi Gbemileke" }
//  *               phoneNumber: { type: string, example: "+2348012345678" }
//  *               gender: { type: string, enum: [male, female, other], example: "male" }
//  *               avatar: { type: string, format: binary, description: "Upload raw image file" }
//  *               address: { type: string, description: "Stringified JSON object" }
//  *     responses:
//  *       200:
//  *         description: Profile updated successfully
//  *       400:
//  *         description: Invalid gender or address format payload
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Account is suspended
//  */
// router.put("/profile", protect, upload.single("avatar"), updateUserProfile);

// /**
//  * @openapi
//  * /api/user/profile:
//  *   delete:
//  *     summary: Permanently delete your own user profile account
//  *     tags: [Authentication & Users]
//  *     security:
//  *       - BearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Account removed successfully
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Account is suspended
//  *       404:
//  *         description: User record not found
//  *       500:
//  *         description: Internal Server Error
//  */
// router.delete("/profile", protect, deleteUserProfile);

// /**
//  * @openapi
//  * /api/user/change-password:
//  *   put:
//  *     summary: Change authenticated user password
//  *     tags: [Authentication & Users]
//  *     security:
//  *       - BearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [currentPassword, newPassword]
//  *             properties:
//  *               currentPassword: { type: string, example: "OldPassword123" }
//  *               newPassword: { type: string, example: "NewSecurePassword456" }
//  *     responses:
//  *       200:
//  *         description: Password changed successfully
//  *       400:
//  *         description: Missing required fields or incorrect current password
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Account is suspended
//  *       500:
//  *         $ref: '#/components/schemas/ErrorResponse'
//  */
// router.put("/change-password", protect, changePassword);

// // ==========================================
// // ADMIN-ONLY MANAGEMENT ROUTES
// // ==========================================

// /**
//  * @openapi
//  * /api/user:
//  *   get:
//  *     summary: Retrieve list of all hospital users (Admin Only)
//  *     tags: [Authentication & Users]
//  *     security:
//  *       - BearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Directory list retrieved successfully
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Admin role)
//  */
// router.get("/", protect, authorize("admin", "practitioner"), getUserProfiles);

// /**
//  * @openapi
//  * /api/user/{id}/role:
//  *   patch:
//  *     summary: Update user role by ID (Admin only)
//  *     tags: [Authentication & Users]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: User MongoDB ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [role]
//  *             properties:
//  *               role:
//  *                 type: string
//  *                 enum: [patient, practitioner, admin]
//  *                 example: "practitioner"
//  *     responses:
//  *       200:
//  *         description: User role updated successfully
//  *       400:
//  *         description: Invalid role provided
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Admin role)
//  *       404:
//  *         description: User record not found
//  */
// router.patch("/:id/role", protect, authorize("admin"), updateUserRole);

// /**
//  * @openapi
//  * /api/user/{id}/suspend:
//  *   patch:
//  *     summary: Suspend or unsuspend user account (Admin only)
//  *     tags: [Authentication & Users]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: User MongoDB ID
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [isSuspended]
//  *             properties:
//  *               isSuspended:
//  *                 type: boolean
//  *                 example: true
//  *               reason:
//  *                 type: string
//  *                 example: "Violation of terms of service"
//  *     responses:
//  *       200:
//  *         description: User suspension status updated successfully
//  *       400:
//  *         description: Invalid payload format
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Admin role)
//  *       404:
//  *         description: User record not found
//  */
// router.patch("/:id/suspend", protect, authorize("admin"), suspendUser);

// export default router;


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
  suspendUser,
  changePassword,
  forgotPassword,
  resetPassword,
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
 *       403:
 *         description: Account is suspended
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

/**
 * @openapi
 * /api/user/forgot-password:
 *   post:
 *     summary: Request password reset email link
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
 *         description: Reset email dispatch initiated (always returns 200 to prevent email enumeration)
 *       400:
 *         description: Email is required
 *       500:
 *         description: Failed to deliver email or server error
 */
router.post("/forgot-password", forgotPassword);

/**
 * @openapi
 * /api/user/reset-password/{token}:
 *   post:
 *     summary: Reset account password using token from email link
 *     tags: [Authentication & Users]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The password reset token received via email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, example: "NewSecurePassword123!" }
 *     responses:
 *       200:
 *         description: Password successfully updated
 *       400:
 *         description: Token is missing, invalid, or expired
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/reset-password/:token", resetPassword);

// ==========================================
// PROTECTED USER ROUTES
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
 *       403:
 *         description: Account is suspended
 */
router.get("/profile", protect, getUserProfile);

/**
 * @openapi
 * /api/user/profile:
 *   put:
 *     summary: Update profile fields and/or upload avatar image
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
 *               address: { type: string, description: "Stringified JSON object" }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid gender or address format payload
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Account is suspended
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
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Account is suspended
 *       404:
 *         description: User record not found
 *       500:
 *         description: Internal Server Error
 */
router.delete("/profile", protect, deleteUserProfile);

/**
 * @openapi
 * /api/user/change-password:
 *   put:
 *     summary: Change authenticated user password
 *     tags: [Authentication & Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, example: "OldPassword123" }
 *               newPassword: { type: string, example: "NewSecurePassword456" }
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Missing required fields or incorrect current password
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Account is suspended
 *       500:
 *         $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/change-password", protect, changePassword);

// ==========================================
// ADMIN-ONLY MANAGEMENT ROUTES
// ==========================================

/**
 * @openapi
 * /api/user:
 *   get:
 *     summary: Retrieve list of all hospital users (Admin Only)
 *     tags: [Authentication & Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Directory list retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Admin role)
 */
router.get("/", protect, authorize("admin", "practitioner"), getUserProfiles);

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
 */
router.patch("/:id/role", protect, authorize("admin"), updateUserRole);

/**
 * @openapi
 * /api/user/{id}/suspend:
 *   patch:
 *     summary: Suspend or unsuspend user account (Admin only)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isSuspended]
 *             properties:
 *               isSuspended:
 *                 type: boolean
 *                 example: true
 *               reason:
 *                 type: string
 *                 example: "Violation of terms of service"
 *     responses:
 *       200:
 *         description: User suspension status updated successfully
 *       400:
 *         description: Invalid payload format
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Admin role)
 *       404:
 *         description: User record not found
 */
router.patch("/:id/suspend", protect, authorize("admin"), suspendUser);

export default router;