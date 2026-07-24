import { Router } from "express";
import {
  initializeCardPayment,
  verifyCardPayment,
  getMyPatientCards,
  addMedicalHistory,
  updateMedicalHistory,
  addPrescription,
  updatePrescription,
  getAllPatientCards,
} from "../controllers/patientCardControllers.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Patient Cards
 *   description: Specialty patient card management, Paystack payments, and clinical history tracking
 */

// ==========================================
// PATIENT CARD ROUTES
// ==========================================

/**
 * @openapi
 * /api/patient-cards/initialize-payment:
 *   post:
 *     summary: Initialize Paystack payment for a specialty card
 *     tags: [Patient Cards]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specialty
 *             properties:
 *               specialty:
 *                 type: string
 *                 example: "anti-natal"
 *     responses:
 *       200:
 *         description: Payment session initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 authorizationUrl:
 *                   type: string
 *                   example: "https://checkout.paystack.com/000000000"
 *                 reference:
 *                   type: string
 *                   example: "T1234567890123"
 *       400:
 *         description: Missing specialty or active paid card already exists
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Failed to initialize payment session
 */
router.post("/initialize-payment", protect, initializeCardPayment);

/**
 * @openapi
 * /api/patient-cards/verify-payment:
 *   post:
 *     summary: Verify Paystack payment and activate patient card
 *     tags: [Patient Cards]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reference
 *               - specialty
 *             properties:
 *               reference:
 *                 type: string
 *                 example: "T1234567890123"
 *               specialty:
 *                 type: string
 *                 example: "anti-natal"
 *               age:
 *                 type: integer
 *                 example: 32
 *               maritalStatus:
 *                 type: string
 *                 enum: [single, married, divorced, widowed]
 *                 example: "single"
 *               nextOfKinName:
 *                 type: string
 *                 example: "Jane Doe"
 *               nextOfKinPhone:
 *                 type: string
 *                 example: "+2348012345678"
 *               stateOfOrigin:
 *                 type: string
 *                 example: "Lagos"
 *     responses:
 *       200:
 *         description: Payment verified and card activated successfully
 *       400:
 *         description: Missing fields, payment verification failure, or card already exists
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Verification processing error
 */
router.post("/verify-payment", protect, verifyCardPayment);

/**
 * @openapi
 * /api/patient-cards/me:
 *   get:
 *     summary: Get logged-in user's patient cards
 *     tags: [Patient Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional specialty filter (e.g., anti-natal)
 *         example: "anti-natal"
 *     responses:
 *       200:
 *         description: List of patient cards retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Error fetching cards
 */
router.get("/me", protect, getMyPatientCards);

/**
 * @openapi
 * /api/patient-cards:
 *   get:
 *     summary: Retrieve all patient cards across the hospital (Practitioner/Admin only)
 *     tags: [Patient Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter cards by specialty slug
 *         example: "anti-natal"
 *       - in: query
 *         name: isPaid
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter cards by payment status
 *         example: true
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter cards for a specific patient by MongoDB ID
 *         example: "65a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: List of all matched patient cards retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Practitioner or Admin role)
 *       500:
 *         description: Error retrieving patient cards
 */
router.get(
  "/",
  protect,
  authorize("practitioner", "admin"),
  getAllPatientCards
);

/**
 * @openapi
 * /api/patient-cards/{id}/history:
 *   post:
 *     summary: Add a medical history note to a patient card
 *     tags: [Patient Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Patient Card MongoDB ID
 *         example: "65a123456789abcdef123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 example: "Patient presented with mild chest tightness. Prescribed routine EKG."
 *     responses:
 *       200:
 *         description: Medical history recorded successfully
 *       400:
 *         description: Missing required note field
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Practitioner or Admin role)
 *       404:
 *         description: Patient card not found
 *       500:
 *         description: Failed to add history
 */
router.post(
  "/:id/history",
  protect,
  authorize("practitioner", "admin"),
  addMedicalHistory
);

/**
 * @openapi
 * /api/patient-cards/{id}/history/{historyId}:
 *   put:
 *     summary: Update an existing medical history note on a patient card
 *     tags: [Patient Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Patient Card MongoDB ID
 *         example: "65a123456789abcdef123456"
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Medical History entry subdocument ID
 *         example: "65a987654321fedcba654321"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - note
 *             properties:
 *               note:
 *                 type: string
 *                 example: "Updated note: Patient's EKG returned normal results."
 *     responses:
 *       200:
 *         description: Medical history entry updated successfully
 *       400:
 *         description: Missing required note field
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Practitioner or Admin role)
 *       404:
 *         description: Patient card or history entry not found
 *       500:
 *         description: Failed to update history
 */
router.put(
  "/:id/history/:historyId",
  protect,
  authorize("practitioner", "admin"),
  updateMedicalHistory
);

/**
 * @openapi
 * /api/patient-cards/{id}/prescriptions:
 *   post:
 *     summary: Add a prescription entry to a patient card
 *     tags: [Patient Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Patient Card MongoDB ID
 *         example: "65a123456789abcdef123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product
 *               - dosage
 *             properties:
 *               product:
 *                 type: string
 *                 example: "Amoxicillin 500mg"
 *               dosage:
 *                 type: string
 *                 example: "1 capsule 3 times daily for 7 days"
 *     responses:
 *       200:
 *         description: Prescription added successfully
 *       400:
 *         description: Missing product or dosage
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Practitioner or Admin role)
 *       404:
 *         description: Patient card not found
 *       500:
 *         description: Error adding prescription
 */
router.post(
  "/:id/prescriptions",
  protect,
  authorize("practitioner", "admin"),
  addPrescription
);

/**
 * @openapi
 * /api/patient-cards/{id}/prescriptions/{prescriptionId}:
 *   put:
 *     summary: Update an existing prescription entry on a patient card
 *     tags: [Patient Cards]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Patient Card MongoDB ID
 *         example: "65a123456789abcdef123456"
 *       - in: path
 *         name: prescriptionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Prescription subdocument ID
 *         example: "65a987654321fedcba654321"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 example: "Amoxicillin 250mg"
 *               dosage:
 *                 type: string
 *                 example: "1 capsule twice daily for 5 days"
 *     responses:
 *       200:
 *         description: Prescription entry updated successfully
 *       400:
 *         description: Missing update payload
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Practitioner or Admin role)
 *       404:
 *         description: Patient card or prescription entry not found
 *       500:
 *         description: Failed to update prescription
 */
router.put(
  "/:id/prescriptions/:prescriptionId",
  protect,
  authorize("practitioner", "admin"),
  updatePrescription
);

export default router;