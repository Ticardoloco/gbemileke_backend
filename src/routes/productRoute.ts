import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../utils/cloudinary.js";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productControllers.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Products
 *   description: Product management endpoints
 */

// ==========================================
// PRODUCT ROUTES
// ==========================================

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Create a new product (Requires image upload)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - price
 *               - description
 *               - usage
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Agbo Jedi Tea"
 *               category:
 *                 type: string
 *                 enum:
 *                   - anti-natal
 *                   - post-natal
 *                   - labor-and-delivery
 *                   - stroke-recovery
 *                   - bone-setting
 *                   - infertility
 *                   - infection-treatment
 *                 example: "infection-treatment"
 *               price:
 *                 type: number
 *                 example: 3500
 *               stock:
 *                 type: number
 *                 default: 0
 *                 example: 25
 *               description:
 *                 type: string
 *                 example: "Herbal remedy for internal cleansing and back relief."
 *               usage:
 *                 type: string
 *                 example: "Take 1 tablespoon daily after meals with warm water."
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image file to upload
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Missing required fields or validation error
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Retrieve all products (Supports filtering, search, and pagination)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by specialty category
 *         example: "infection-treatment"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name (case-insensitive)
 *         example: "Agbo"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *       500:
 *         description: Internal server error
 */
router
  .route("/")
  .post(protect, upload.single("image"), createProduct)
  .get(getProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Update a product by ID (Optional new image upload)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the product
 *         example: "65a123456789abcdef123456"
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Agbo Jedi Tea (Updated)"
 *               category:
 *                 type: string
 *                 example: "infection-treatment"
 *               price:
 *                 type: number
 *                 example: 4000
 *               stock:
 *                 type: number
 *                 example: 30
 *               description:
 *                 type: string
 *                 example: "Updated herbal formula for better strength."
 *               usage:
 *                 type: string
 *                 example: "Take 2 tablespoons daily with warm water."
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional new product image file
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid product ID or validation error
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the product
 *         example: "65a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Invalid product ID format
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router
  .route("/:id")
  .put(protect, upload.single("image"), updateProduct)
  .delete(protect, deleteProduct);

export default router;