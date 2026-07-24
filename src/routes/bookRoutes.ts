import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  bookAppointment,
  getAppointments,
  getAppointment,
  updateStatus,
  deleteAppointment,
  getPatientAppointment,
} from "../controllers/bookControllers.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Bookings
 *   description: Appointment booking management endpoints
 */

// ==========================================
// PROTECTED APPOINTMENT ROUTES
// ==========================================

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     summary: Book a new appointment (Requires active paid patient card for selected specialty)
 *     tags: [Bookings]
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
 *               - date
 *               - time
 *             properties:
 *               specialty:
 *                 type: string
 *                 enum:
 *                   - anti-natal
 *                   - post-natal
 *                   - labor-and-delivery
 *                   - stroke-recovery
 *                   - bone-setting
 *                   - infertility
 *                   - infection-treatment
 *                 example: "anti-natal"
 *               date:
 *                 type: string
 *                 example: "2026-08-15"
 *               time:
 *                 type: string
 *                 example: "10:30 AM"
 *               type:
 *                 type: string
 *                 enum: [In-person, Virtual]
 *                 default: In-person
 *                 example: "In-person"
 *               symptoms:
 *                 type: string
 *                 example: "Mild back pain and headache"
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Missing required fields or invalid request data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - Patient does not have an active registered/paid card for this specialty
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Retrieve all appointments
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Internal server error
 */
router.route("/").post(protect, bookAppointment).get(protect, getAppointments);

/**
 * @openapi
 * /api/bookings/my-appointments:
 *   get:
 *     summary: Get appointments for the authenticated logged-in patient
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Patient appointments retrieved successfully
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Internal server error
 */
router.get("/my-appointments", protect, getPatientAppointment);

/**
 * @openapi
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a single appointment by ID
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the appointment
 *         example: "65a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Appointment retrieved successfully
 *       400:
 *         description: Invalid appointment ID format
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Delete an appointment by ID
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the appointment
 *         example: "65a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *       400:
 *         description: Invalid appointment ID format
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Internal server error
 */
router
  .route("/:id")
  .get(protect, getAppointment)
  .delete(protect, deleteAppointment);

/**
 * @openapi
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update an appointment status
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the appointment
 *         example: "65a123456789abcdef123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Approved, Completed, Cancelled]
 *                 example: Approved
 *     responses:
 *       200:
 *         description: Appointment status updated successfully
 *       400:
 *         description: Invalid ID format or invalid status value
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id/status", protect, updateStatus);

export default router;