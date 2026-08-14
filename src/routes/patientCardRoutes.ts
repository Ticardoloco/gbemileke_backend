// import { Router } from "express";
// import {
//   initializeCardPayment,
//   verifyCardPayment,
//   getMyPatientCards,
//   getPatientCardById,
//   getAllPatientCards,
//   addMedicalHistory,
//   updateMedicalHistory,
//   deleteMedicalHistory,
//   addPrescription,
//   updatePrescription,
//   deletePrescription,
//   addTreatmentSession,
//   updateTreatmentSession,
//   recordPayment,
// } from "../controllers/patientCardControllers.js";
// import { protect, authorize } from "../middleware/authMiddleware.js";

// const router = Router();

// /**
//  * @openapi
//  * tags:
//  *   name: Patient Cards
//  *   description: Specialty patient card management, Paystack payments, clinical tracking, and billing
//  */

// // ==========================================
// // PATIENT CARD CORE & PAYMENT ROUTES
// // ==========================================

// /**
//  * @openapi
//  * /api/patient-cards/initialize-payment:
//  *   post:
//  *     summary: Initialize Paystack payment for a specialty card
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - specialty
//  *             properties:
//  *               specialty:
//  *                 type: string
//  *                 description: Specialty module slug
//  *                 example: "anti-natal"
//  *     responses:
//  *       200:
//  *         description: Payment session initialized successfully
//  *       400:
//  *         description: Missing specialty or active paid card already exists
//  *       401:
//  *         description: Not authorized
//  *       500:
//  *         description: Failed to initialize payment session
//  */
// router.post("/initialize-payment", protect, initializeCardPayment);

// /**
//  * @openapi
//  * /api/patient-cards/verify-payment:
//  *   post:
//  *     summary: Verify Paystack payment and activate patient card
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - reference
//  *               - specialty
//  *               - dateOfBirth
//  *               - maritalStatus
//  *               - nextOfKinName
//  *               - nextOfKinPhone
//  *               - stateOfOrigin
//  *             properties:
//  *               reference:
//  *                 type: string
//  *                 description: Paystack transaction reference
//  *                 example: "T1234567890123"
//  *               specialty:
//  *                 type: string
//  *                 description: Card specialty type
//  *                 example: "anti-natal"
//  *               dateOfBirth:
//  *                 type: string
//  *                 format: date
//  *                 example: "1992-05-15"
//  *               maritalStatus:
//  *                 type: string
//  *                 enum: [single, married, divorced, widowed]
//  *                 example: "single"
//  *               nextOfKinName:
//  *                 type: string
//  *                 example: "Jane Doe"
//  *               nextOfKinPhone:
//  *                 type: string
//  *                 example: "+2348012345678"
//  *               stateOfOrigin:
//  *                 type: string
//  *                 example: "Lagos"
//  *     responses:
//  *       200:
//  *         description: Payment verified and card activated successfully
//  *       400:
//  *         description: Missing fields, payment verification failure, or card already exists
//  *       401:
//  *         description: Not authorized
//  *       500:
//  *         description: Verification processing error
//  */
// router.post("/verify-payment", protect, verifyCardPayment);

// /**
//  * @openapi
//  * /api/patient-cards/me:
//  *   get:
//  *     summary: Get logged-in user's patient cards
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: specialty
//  *         schema:
//  *           type: string
//  *         required: false
//  *         description: Optional specialty filter
//  *         example: "anti-natal"
//  *     responses:
//  *       200:
//  *         description: List of patient cards retrieved successfully
//  *       401:
//  *         description: Not authorized
//  *       500:
//  *         description: Error fetching cards
//  */
// router.get("/me", protect, getMyPatientCards);

// /**
//  * @openapi
//  * /api/patient-cards:
//  *   get:
//  *     summary: Retrieve all patient cards across the hospital (Medical Staff / Admin)
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: specialty
//  *         schema:
//  *           type: string
//  *         required: false
//  *         description: Filter cards by specialty slug
//  *         example: "anti-natal"
//  *       - in: query
//  *         name: isPaid
//  *         schema:
//  *           type: boolean
//  *         required: false
//  *         description: Filter cards by payment status
//  *         example: true
//  *       - in: query
//  *         name: patientId
//  *         schema:
//  *           type: string
//  *         required: false
//  *         description: Filter cards for a specific patient by MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *     responses:
//  *       200:
//  *         description: List of all matched patient cards retrieved successfully
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Staff or Admin role)
//  *       500:
//  *         description: Error retrieving patient cards
//  */
// router.get(
//   "/",
//   protect,
//   authorize("practitioner", "admin"),
//   getAllPatientCards
// );

// /**
//  * @openapi
//  * /api/patient-cards/{id}:
//  *   get:
//  *     summary: Get a single patient card by ID
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *     responses:
//  *       200:
//  *         description: Patient card details retrieved successfully
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (User is not owner or medical staff)
//  *       404:
//  *         description: Patient card not found
//  *       500:
//  *         description: Error retrieving patient card
//  */
// router.get("/:id", protect, getPatientCardById);

// // ==========================================
// // MEDICAL HISTORY ROUTES
// // ==========================================

// /**
//  * @openapi
//  * /api/patient-cards/{id}/history:
//  *   post:
//  *     summary: Add a medical history note to a patient card
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - note
//  *             properties:
//  *               note:
//  *                 type: string
//  *                 description: Detailed medical diagnosis or clinical notes
//  *                 example: "Patient presented with mild chest tightness. Prescribed routine EKG."
//  *     responses:
//  *       200:
//  *         description: Medical history recorded successfully
//  *       400:
//  *         description: Missing required note field
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Medical Staff or Admin role)
//  *       404:
//  *         description: Patient card not found
//  *       500:
//  *         description: Failed to add history
//  */
// router.post(
//   "/:id/history",
//   protect,
//   authorize("practitioner", "admin"),
//   addMedicalHistory
// );

// /**
//  * @openapi
//  * /api/patient-cards/{id}/history/{historyId}:
//  *   put:
//  *     summary: Update an existing medical history note on a patient card
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *       - in: path
//  *         name: historyId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Medical History entry subdocument ID
//  *         example: "65a987654321fedcba654321"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - note
//  *             properties:
//  *               note:
//  *                 type: string
//  *                 description: Updated clinical notes
//  *                 example: "Updated note: Patient's EKG returned normal results."
//  *     responses:
//  *       200:
//  *         description: Medical history entry updated successfully
//  *       400:
//  *         description: Missing required note field
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Medical Staff or Admin role)
//  *       404:
//  *         description: Patient card or history entry not found
//  *       500:
//  *         description: Failed to update history
//  */
// router.put(
//   "/:id/history/:historyId",
//   protect,
//   authorize("practitioner", "admin"),
//   updateMedicalHistory
// );

// /**
//  * @openapi
//  * /api/patient-cards/{id}/history/{historyId}:
//  *   delete:
//  *     summary: Delete a medical history entry from a patient card
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *       - in: path
//  *         name: historyId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Medical History entry subdocument ID
//  *         example: "65a987654321fedcba654321"
//  *     responses:
//  *       200:
//  *         description: Medical history entry deleted successfully
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Medical Staff or Admin role)
//  *       404:
//  *         description: Patient card or history entry not found
//  *       500:
//  *         description: Failed to delete history
//  */
// router.delete(
//   "/:id/history/:historyId",
//   protect,
//   authorize("practitioner", "admin"),
//   deleteMedicalHistory
// );

// // ==========================================
// // PRESCRIPTION ROUTES
// // ==========================================

// /**
//  * @openapi
//  * /api/patient-cards/{id}/prescriptions:
//  *   post:
//  *     summary: Add a prescription entry to a patient card
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - product
//  *               - dosage
//  *             properties:
//  *               product:
//  *                 type: string
//  *                 description: Name or ID of the medication
//  *                 example: "Amoxicillin 500mg"
//  *               dosage:
//  *                 type: string
//  *                 description: Administration instructions and duration
//  *                 example: "1 capsule 3 times daily for 7 days"
//  *     responses:
//  *       200:
//  *         description: Prescription added successfully
//  *       400:
//  *         description: Missing product or dosage
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Medical Staff or Admin role)
//  *       404:
//  *         description: Patient card not found
//  *       500:
//  *         description: Error adding prescription
//  */
// router.post(
//   "/:id/prescriptions",
//   protect,
//   authorize("practitioner", "admin"),
//   addPrescription
// );

// /**
//  * @openapi
//  * /api/patient-cards/{id}/prescriptions/{prescriptionId}:
//  *   put:
//  *     summary: Update an existing prescription entry on a patient card
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *       - in: path
//  *         name: prescriptionId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Prescription subdocument ID
//  *         example: "65a987654321fedcba654321"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               product:
//  *                 type: string
//  *                 example: "Amoxicillin 250mg"
//  *               dosage:
//  *                 type: string
//  *                 example: "1 capsule twice daily for 5 days"
//  *     responses:
//  *       200:
//  *         description: Prescription entry updated successfully
//  *       400:
//  *         description: Missing update payload
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Medical Staff or Admin role)
//  *       404:
//  *         description: Patient card or prescription entry not found
//  *       500:
//  *         description: Failed to update prescription
//  */
// router.put(
//   "/:id/prescriptions/:prescriptionId",
//   protect,
//   authorize("practitioner", "admin"),
//   updatePrescription
// );

// /**
//  * @openapi
//  * /api/patient-cards/{id}/prescriptions/{prescriptionId}:
//  *   delete:
//  *     summary: Delete a prescription entry from a patient card
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *       - in: path
//  *         name: prescriptionId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Prescription subdocument ID
//  *         example: "65a987654321fedcba654321"
//  *     responses:
//  *       200:
//  *         description: Prescription deleted successfully
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Medical Staff or Admin role)
//  *       404:
//  *         description: Patient card or prescription not found
//  *       500:
//  *         description: Failed to delete prescription
//  */
// router.delete(
//   "/:id/prescriptions/:prescriptionId",
//   protect,
//   authorize("practitioner", "admin"),
//   deletePrescription
// );

// // ==========================================
// // BILLING & TREATMENT SESSIONS ROUTES
// // ==========================================

// /**
//  * @openapi
//  * /api/patient-cards/{id}/billing/sessions:
//  *   post:
//  *     summary: Add a treatment session charge to a patient card
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - title
//  *               - cost
//  *             properties:
//  *               title:
//  *                 type: string
//  *                 description: Description of procedure/session
//  *                 example: "Physical Therapy Session 1"
//  *               cost:
//  *                 type: number
//  *                 description: Total session charge amount
//  *                 example: 15000
//  *               notes:
//  *                 type: string
//  *                 description: Treatment notes for session
//  *                 example: "Lower back assessment and ultrasound therapy"
//  *     responses:
//  *       200:
//  *         description: Treatment session logged successfully
//  *       400:
//  *         description: Missing required fields or invalid data
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Medical Staff or Admin role)
//  *       404:
//  *         description: Patient card not found
//  *       500:
//  *         description: Error logging treatment session
//  */
// router.post(
//   "/:id/billing/sessions",
//   protect,
//   authorize("practitioner", "admin"),
//   addTreatmentSession
// );

// /**
//  * @openapi
//  * /api/patient-cards/{id}/billing/sessions/{sessionId}:
//  *   put:
//  *     summary: Update an existing treatment session entry
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *       - in: path
//  *         name: sessionId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Treatment Session subdocument ID
//  *         example: "65a987654321fedcba654321"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               sessionType:
//  *                 type: string
//  *                 example: "Physical Therapy Session 2"
//  *               cost:
//  *                 type: number
//  *                 example: 18000
//  *               notes:
//  *                 type: string
//  *                 example: "Updated progress: reduced lumbar inflammation"
//  *     responses:
//  *       200:
//  *         description: Treatment session updated successfully
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Medical Staff or Admin role)
//  *       404:
//  *         description: Patient card or session not found
//  *       500:
//  *         description: Failed to update treatment session
//  */
// router.put(
//   "/:id/billing/sessions/:sessionId",
//   protect,
//   authorize("practitioner", "admin"),
//   updateTreatmentSession
// );

// /**
//  * @openapi
//  * /api/patient-cards/{id}/billing/payments:
//  *   post:
//  *     summary: Record an offline or manual bill payment against a patient card balance
//  *     tags: [Patient Cards]
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The Patient Card MongoDB ID
//  *         example: "65a123456789abcdef123456"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - amount
//  *               - paymentMethod
//  *             properties:
//  *               amount:
//  *                 type: number
//  *                 description: Total paid amount
//  *                 example: 10000
//  *               paymentMethod:
//  *                 type: string
//  *                 enum: [cash, card, transfer, pos]
//  *                 example: "pos"
//  *               reference:
//  *                 type: string
//  *                 description: POS/Bank reference code
//  *                 example: "POS-REF-987654"
//  *     responses:
//  *       200:
//  *         description: Payment recorded successfully
//  *       400:
//  *         description: Invalid amount or payment details
//  *       401:
//  *         description: Not authorized
//  *       403:
//  *         description: Forbidden (Requires Medical Staff or Admin role)
//  *       404:
//  *         description: Patient card not found
//  *       500:
//  *         description: Error recording payment
//  */
// router.post(
//   "/:id/billing/payments",
//   protect,
//   authorize("practitioner", "admin"),
//   recordPayment
// );

// export default router;

import { Router } from "express";
import {
  initializeCardPayment,
  verifyCardPayment,
  getMyPatientCards,
  getPatientCardById,
  getAllPatientCards,
  addMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,
  addPrescription,
  updatePrescription,
  deletePrescription,
  addTreatmentSession,
  updateTreatmentSession,
  closeTreatmentSession,
  recordPayment,
} from "../controllers/patientCardControllers.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Patient Cards
 *   description: Specialty patient card management, Paystack payments, clinical tracking, and billing
 */

// ==========================================
// PATIENT CARD CORE & PAYMENT ROUTES
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
 *                 description: Specialty module slug
 *                 example: "anti-natal"
 *     responses:
 *       200:
 *         description: Payment session initialized successfully
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
 *               - dateOfBirth
 *               - maritalStatus
 *               - nextOfKinName
 *               - nextOfKinPhone
 *               - stateOfOrigin
 *             properties:
 *               reference:
 *                 type: string
 *                 description: Paystack transaction reference
 *                 example: "T1234567890123"
 *               specialty:
 *                 type: string
 *                 description: Card specialty type
 *                 example: "anti-natal"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1992-05-15"
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
 *         description: Optional specialty filter
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
 *     summary: Retrieve all patient cards across the hospital (Medical Staff / Admin)
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
 *         description: Forbidden (Requires Staff or Admin role)
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
 * /api/patient-cards/{id}:
 *   get:
 *     summary: Get a single patient card by ID
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
 *     responses:
 *       200:
 *         description: Patient card details retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (User is not owner or medical staff)
 *       404:
 *         description: Patient card not found
 *       500:
 *         description: Error retrieving patient card
 */
router.get("/:id", protect, getPatientCardById);

// ==========================================
// MEDICAL HISTORY ROUTES
// ==========================================

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
 *                 description: Detailed medical diagnosis or clinical notes
 *                 example: "Patient presented with mild chest tightness. Prescribed routine EKG."
 *     responses:
 *       200:
 *         description: Medical history recorded successfully
 *       400:
 *         description: Missing required note field
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Medical Staff or Admin role)
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
 *                 description: Updated clinical notes
 *                 example: "Updated note: Patient's EKG returned normal results."
 *     responses:
 *       200:
 *         description: Medical history entry updated successfully
 *       400:
 *         description: Missing required note field
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Medical Staff or Admin role)
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
 * /api/patient-cards/{id}/history/{historyId}:
 *   delete:
 *     summary: Delete a medical history entry from a patient card
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
 *     responses:
 *       200:
 *         description: Medical history entry deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Medical Staff or Admin role)
 *       404:
 *         description: Patient card or history entry not found
 *       500:
 *         description: Failed to delete history
 */
router.delete(
  "/:id/history/:historyId",
  protect,
  authorize("practitioner", "admin"),
  deleteMedicalHistory
);

// ==========================================
// PRESCRIPTION ROUTES
// ==========================================

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
 *                 description: Name or ID of the medication
 *                 example: "Amoxicillin 500mg"
 *               dosage:
 *                 type: string
 *                 description: Administration instructions and duration
 *                 example: "1 capsule 3 times daily for 7 days"
 *     responses:
 *       200:
 *         description: Prescription added successfully
 *       400:
 *         description: Missing product or dosage
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Medical Staff or Admin role)
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
 *         description: Forbidden (Requires Medical Staff or Admin role)
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

/**
 * @openapi
 * /api/patient-cards/{id}/prescriptions/{prescriptionId}:
 *   delete:
 *     summary: Delete a prescription entry from a patient card
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
 *     responses:
 *       200:
 *         description: Prescription deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Medical Staff or Admin role)
 *       404:
 *         description: Patient card or prescription not found
 *       500:
 *         description: Failed to delete prescription
 */
router.delete(
  "/:id/prescriptions/:prescriptionId",
  protect,
  authorize("practitioner", "admin"),
  deletePrescription
);

// ==========================================
// BILLING & TREATMENT SESSIONS ROUTES
// ==========================================

/**
 * @openapi
 * /api/patient-cards/{id}/billing/sessions:
 *   post:
 *     summary: Add a treatment session charge to a patient card
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
 *               - title
 *               - cost
 *             properties:
 *               title:
 *                 type: string
 *                 description: Description of procedure/session
 *                 example: "Physical Therapy Session 1"
 *               cost:
 *                 type: number
 *                 description: Total session charge amount
 *                 example: 15000
 *               notes:
 *                 type: string
 *                 description: Treatment notes for session
 *                 example: "Lower back assessment and ultrasound therapy"
 *     responses:
 *       200:
 *         description: Treatment session logged successfully
 *       400:
 *         description: Missing required fields or invalid data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Medical Staff or Admin role)
 *       404:
 *         description: Patient card not found
 *       500:
 *         description: Error logging treatment session
 */
router.post(
  "/:id/billing/sessions",
  protect,
  authorize("practitioner", "admin"),
  addTreatmentSession
);

/**
 * @openapi
 * /api/patient-cards/{id}/billing/sessions/{sessionId}:
 *   put:
 *     summary: Update an existing treatment session entry
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
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Treatment Session subdocument ID
 *         example: "65a987654321fedcba654321"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionType:
 *                 type: string
 *                 example: "Physical Therapy Session 2"
 *               cost:
 *                 type: number
 *                 example: 18000
 *               notes:
 *                 type: string
 *                 example: "Updated progress: reduced lumbar inflammation"
 *     responses:
 *       200:
 *         description: Treatment session updated successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Medical Staff or Admin role)
 *       404:
 *         description: Patient card or session not found
 *       500:
 *         description: Failed to update treatment session
 */
router.put(
  "/:id/billing/sessions/:sessionId",
  protect,
  authorize("practitioner", "admin"),
  updateTreatmentSession
);

/**
 * @openapi
 * /api/patient-cards/{id}/billing/sessions/{sessionId}/close:
 *   patch:
 *     summary: Close an active treatment session
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
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Treatment Session subdocument ID
 *         example: "65a987654321fedcba654321"
 *     responses:
 *       200:
 *         description: Treatment session closed successfully
 *       400:
 *         description: Session is already closed
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Medical Staff or Admin role)
 *       404:
 *         description: Patient card or session not found
 *       500:
 *         description: Failed to close treatment session
 */
router.patch(
  "/:id/billing/sessions/:sessionId/close",
  protect,
  authorize("practitioner", "admin"),
  closeTreatmentSession
);

/**
 * @openapi
 * /api/patient-cards/{id}/billing/payments:
 *   post:
 *     summary: Record an offline or manual bill payment against a patient card balance
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
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Total paid amount
 *                 example: 10000
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, card, transfer, pos]
 *                 example: "pos"
 *               reference:
 *                 type: string
 *                 description: POS/Bank reference code
 *                 example: "POS-REF-987654"
 *     responses:
 *       200:
 *         description: Payment recorded successfully
 *       400:
 *         description: Invalid amount or payment details
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden (Requires Medical Staff or Admin role)
 *       404:
 *         description: Patient card not found
 *       500:
 *         description: Error recording payment
 */
router.post(
  "/:id/billing/payments",
  protect,
  authorize("practitioner", "admin"),
  recordPayment
);

export default router;