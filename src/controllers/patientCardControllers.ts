import { Request, Response } from "express";
import axios from "axios";
import PatientCard, { MaritalTypes } from "../models/PatientCardModel.js";
import { SpecialtySlug } from "../models/specialitiesModel";


const DEFAULT_CARD_FEE = 10000;

/**
 * @desc    Initialize Paystack Payment for Patient Card
 * @route   POST /api/patient-cards/initialize-payment
 * @access  Private (Patient)
 */

export async function initializeCardPayment(req: Request, res: Response) {
  try {

    const paystackSecretKey = process.env["PAYSTACK_SECRET_KEY"];

    if (!paystackSecretKey) {
      return res.status(500).json({
        message: "Paystack secret key is missing in environment variables.",
      });
    }
    const userId = req.user?._id;
    const userEmail = req.user?.email;
    const { specialty } = req.body as {
      specialty: SpecialtySlug;
    };

    if (!specialty) {
      return res
        .status(400)
        .json({ message: "Specialty is required to initialized a card" });
    }
    

    // Check if user already has an active, paid card for THIS specific specialty
    const existingCard = await PatientCard.findOne({
      patient: userId,
      specialty,
    });
    if (existingCard?.isPaid) {
      return res.status(400).json({
        message: `You already have an active paid patient card for ${specialty}`,
      });
    }

    // Call Paystack API

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: userEmail,
        amount: DEFAULT_CARD_FEE * 100, // Paystack expects amount in Kobo
        callback_url: `${process.env["FRONTEND_URL"]}/patient-card`,
        metadata: {
          userId: userId?.toString(),
          specialty,
          paymentType: "SPECIALTY_CARD_REGISTRATION",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const { authorization_url, reference } = response.data.data;

    return res.status(200).json({
      success: true,
      authorizationUrl: authorization_url,
      reference,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to initialize payment session.",
      error: error.response?.data?.message || error.message,
    });
  }
}

/**
 * @desc    Verify Payment & Activate Specialty Patient Card
 * @route   POST /api/patient-cards/verify-payment
 * @access  Private
 */

export async function verifyCardPayment(req: Request, res: Response) {
  try {

    const paystackSecretKey = process.env["PAYSTACK_SECRET_KEY"];

    if (!paystackSecretKey) {
      return res.status(500).json({
        message: "Paystack secret key is missing in environment variables.",
      });
    }
    const {
      reference,
      specialty,
      dateOfBirth,
      maritalStatus,
      nextOfKinName,
      nextOfKinPhone,
      stateOfOrigin,
    } = req.body as {
      reference: string;
      specialty: SpecialtySlug;
      dateOfBirth: string | Date;
      maritalStatus: MaritalTypes;
      nextOfKinName: string;
      nextOfKinPhone: string;
      stateOfOrigin: string;
    };

    const userId = req.user?._id;

    if (!reference || !specialty) {
      return res.status(400).json({
        message: "Transaction reference and specialty are required.",
      });
    }

    // Prevent duplicate verification processing
    const existingReference = await PatientCard.findOne({ paymentReference: reference });
    if (existingReference) {
      return res.status(200).json({
        success: true,
        message: "Payment reference has already been verified.",
        card: existingReference,
      });
    }

    // Verify transaction with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      },
    );

    const paystackData = response.data.data;
    if (paystackData.status !== "success") {
      return res
        .status(400)
        .json({ message: "Payment verification failed or incomplete." });
    }

    // Look for existing card for this specific patient + specialty
    let card = await PatientCard.findOne({ patient: userId, specialty });

    if (card) {
      card.isPaid = true;
      card.paymentReference = reference;
      if (dateOfBirth) card.dateOfBirth = new Date(dateOfBirth);
      if (maritalStatus) card.maritalStatus = maritalStatus;
      if (nextOfKinName) card.nextOfKinName = nextOfKinName;
      if (nextOfKinPhone) card.nextOfKinPhone = nextOfKinPhone;
      if (stateOfOrigin) card.stateOfOrigin = stateOfOrigin;

      await card.save();
    } else {
      if (!dateOfBirth || !nextOfKinName || !nextOfKinPhone) {
        return res.status(400).json({
          message:
            "Date of birth, next of kin name, and next of kin phone number are required for registration.",
        });
      }
      card = await PatientCard.create({
        patient: userId,
        specialty,
        dateOfBirth: new Date(dateOfBirth),
        maritalStatus,
        nextOfKinName,
        nextOfKinPhone,
        stateOfOrigin,
        isPaid: true,
        paymentReference: reference,
        cardFee: DEFAULT_CARD_FEE,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Card for ${specialty} activated successfully.`,
      card,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "A patient card already exists for this specialty.",
      });
    }

    return res.status(500).json({
      message: "Verification failed.",
      error: error.response?.data?.message || error.message,
    });
  }
}

/**
 * @desc    Get Current User's Patient Cards (All or filtered by query ?specialty=)
 * @route   GET /api/patient-cards/me
 * @access  Private
 */

export async function getMyPatientCards(req: Request, res: Response) {
  try {
    const userId = req.user?._id;
    const { specialty } = req.query;

    const filter: Record<string, any> = { patient: userId };
    if (specialty) {
      filter.specialty = specialty;
    }

    const cards = await PatientCard.find(filter)
      .populate("patient", "fullName email phoneNumber")
      .populate("history.author", "fullName role")
      .populate("billing.sessions.createdBy", "fullName role")
      .populate("billing.paymentHistory.recordedBy", "fullName role");
      
    return res.status(200).json({
      success: true,
      count: cards.length,
      cards,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error fetching cards", error: error.message });
  }
}

/**
 * @desc    Get All Patient Cards across hospital system (Admin / Medical Staff)
 * @route   GET /api/patient-cards
 * @access  Private (Admin / Practitioner)
 */
export async function getAllPatientCards(req: Request, res: Response) {
  try {
    const { specialty, isPaid, patientId } = req.query;

    const filter: Record<string, any> = {};

    if (specialty) {
      filter.specialty = specialty;
    }

    if (isPaid !== undefined) {
      filter.isPaid = isPaid === "true";
    }

    if (patientId) {
      filter.patient = patientId;
    }

    const cards = await PatientCard.find(filter)
      .populate("patient", "fullName email phoneNumber gender avatar")
      .populate("history.author", "fullName role")
      .populate("billing.sessions.createdBy", "fullName role")
      .populate("billing.paymentHistory.recordedBy", "fullName role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: cards.length,
      cards,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error retrieving patient cards.",
      error: error.message,
    });
  }
}

/**
 * @desc    Get Single Patient Card by ID
 * @route   GET /api/patient-cards/:id
 * @access  Private
 */
export async function getPatientCardById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?._id?.toString();
    const userRole = req.user?.role;

    const card = await PatientCard.findById(id)
      .populate("patient", "fullName email phoneNumber gender avatar")
      .populate("history.author", "fullName role")
      .populate("billing.sessions.createdBy", "fullName role")
      .populate("billing.paymentHistory.recordedBy", "fullName role");

    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    // Access check: Only allow access if user is staff/admin OR if the card belongs to the requesting patient
    const isOwner = card.patient?._id?.toString() === userId || card.patient?.toString() === userId;
    const isStaff = userRole && ["admin", "practitioner"].includes(userRole.toLowerCase());

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to view this card.",
      });
    }

    return res.status(200).json({
      success: true,
      card,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error retrieving patient card.",
      error: error.message,
    });
  }
}

/**
 * @desc    Delete Patient Card by ID
 * @route   DELETE /api/patient-cards/:id
 * @access  Private (Admin)
 */
export async function deletePatientCard(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    const card = await PatientCard.findByIdAndDelete(id);

    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Patient card deleted successfully.",
      deletedCardId: id,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete patient card.",
      error: error.message,
    });
  }
}

/**
 * @desc    Add Medical History entry
 * @route   POST /api/patient-cards/:id/history
 * @access  Private (Practic / Admin)
 */
export async function addMedicalHistory(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { note } = req.body as { note: string };
    const authorId = req.user?._id;

    if (!note) {
      return res.status(400).json({ message: "Note field is required." });
    }

    const card = await PatientCard.findById(id);

    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    if (!authorId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: author information missing." });
    }

    card.history.push({
      date: new Date(),
      note,
      author: authorId,
    });

    await card.save();

    return res.status(200).json({
      success: true,
      message: "Medical history recorded.",
      history: card.history,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to add history.",
      error: error.message,
    });
  }
}

/**
 * @desc    Update Medical History entry
 * @route   PUT /api/patient-cards/:id/history/:historyId
 * @access  Private (Doctor / Admin)
 */
export async function updateMedicalHistory(req: Request, res: Response) {
  try {
    const { id, historyId } = req.params as { id: string; historyId: string };
    const { note } = req.body as { note?: string };

    if (!note) {
      return res
        .status(400)
        .json({ message: "Note field is required to update history." });
    }

    const card = await PatientCard.findById(id);

    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    const historyEntry = (card.history as any).id(historyId);

    if (!historyEntry) {
      return res.status(404).json({ message: "Medical history entry not found." });
    }

    historyEntry.note = note;
    await card.save();

    return res.status(200).json({
      success: true,
      message: "Medical history entry updated successfully.",
      history: card.history,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update history.",
      error: error.message,
    });
  }
}

/**
 * @desc    Delete Medical History entry
 * @route   DELETE /api/patient-cards/:id/history/:historyId
 * @access  Private (Doctor / Admin)
 */
export async function deleteMedicalHistory(req: Request, res: Response) {
  try {
    const { id, historyId } = req.params as { id: string; historyId: string };

    const card = await PatientCard.findById(id);
    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    
    const historyEntry = (card.history as any).id(historyId);
    if (!historyEntry) {
      return res.status(404).json({ message: "Medical history entry not found." });
    }

    historyEntry.deleteOne();
    await card.save();

    return res.status(200).json({
      success: true,
      message: "Medical history entry removed successfully.",
      history: card.history,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete history entry.",
      error: error.message,
    });
  }
}

/**
 * @desc    Add Prescription entry to Patient Card
 * @route   POST /api/patient-cards/:id/prescriptions
 * @access  Private (Doctor / Admin)
 */

export async function addPrescription(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { product, dosage } = req.body as {
      product: string;
      dosage: string;
    };

    if (!product || !dosage) {
      return res.status(400).json({
        message: "Product and dosage are required.",
      });
    }

    const card = await PatientCard.findById(id);

    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    card.prescriptions.push({
      date: new Date(),
      product,
      dosage,
    });

    await card.save();

    return res.status(200).json({
      success: true,
      message: "Prescription added.",
      prescriptions: card.prescriptions,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error adding prescription", error: error.message });
  }
}

/**
 * @desc    Update an existing Prescription entry in a Patient Card
 * @route   PUT /api/patient-cards/:id/prescriptions/:prescriptionId
 * @access  Private (Doctor / Admin)
 */
export async function updatePrescription(req: Request, res: Response) {
  try {
    const { id, prescriptionId } = req.params as {
      id: string;
      prescriptionId: string;
    };
    const { product, dosage } = req.body as {
      product?: string;
      dosage?: string;
    };

    if (!product && !dosage) {
      return res.status(400).json({
        message: "At least one field (product or dosage) is required to update.",
      });
    }

    const card = await PatientCard.findById(id);

    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    const prescriptionEntry = (card.prescriptions as any).id(prescriptionId);

    if (!prescriptionEntry) {
      return res.status(404).json({ message: "Prescription entry not found." });
    }

    if (product) prescriptionEntry.product = product;
    if (dosage) prescriptionEntry.dosage = dosage;

    await card.save();

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully.",
      prescriptions: card.prescriptions,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update prescription.",
      error: error.message,
    });
  }
}

/**
 * @desc    Delete Prescription entry
 * @route   DELETE /api/patient-cards/:id/prescriptions/:prescriptionId
 * @access  Private (Doctor / Admin)
 */
export async function deletePrescription(req: Request, res: Response) {
  try {
    const { id, prescriptionId } = req.params as {
      id: string;
      prescriptionId: string;
    };

    const card = await PatientCard.findById(id);
    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    const prescriptionEntry = (card.prescriptions as any).id(prescriptionId);
    if (!prescriptionEntry) {
      return res.status(404).json({ message: "Prescription entry not found." });
    }

    prescriptionEntry.deleteOne();
    await card.save();
    return res.status(200).json({
      success: true,
      message: "Prescription entry removed successfully.",
      prescriptions: card.prescriptions,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to delete prescription.",
      error: error.message,
    });
  }
}

/**
 * @desc    Add a new Treatment/Billing Session
 * @route   POST /api/patient-cards/:id/billing/sessions
 * @access  Private (Doctor / Practitioner / Admin)
 */
export async function addTreatmentSession(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { title, cost, note } = req.body as {
      title: string;
      cost: number;
      note?: string;
    };
    const createdBy = req.user?._id;

    if (!title || cost === undefined || cost < 0) {
      return res.status(400).json({
        message: "Session title and a non-negative cost are required.",
      });
    }

    const card = await PatientCard.findById(id);
    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    card.billing.sessions.push({
      title,
      cost,
      note,
      date: new Date(),
      isClosed: false,
      createdBy,
    });

    await card.save();

    return res.status(200).json({
      success: true,
      message: "New treatment billing session added.",
      billing: card.billing,
      outstandingBalance: card.outstandingBalance,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to add treatment session.",
      error: error.message,
    });
  }
}

/**
 * @desc    Update cost or status of a specific Treatment Session
 * @route   PUT /api/patient-cards/:id/billing/sessions/:sessionId
 * @access  Private (Doctor / Admin)
 */
export async function updateTreatmentSession(req: Request, res: Response) {
  try {
    const { id, sessionId } = req.params as { id: string; sessionId: string };
    const { title, cost, isClosed, note } = req.body as {
      title?: string;
      cost?: number;
      isClosed?: boolean;
      note?: string;
    };

    const card = await PatientCard.findById(id);
    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    const session = (card.billing.sessions as any).id(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Treatment session not found." });
    }

    if (title !== undefined) session.title = title;
    if (cost !== undefined && cost >= 0) session.cost = cost;
    if (isClosed !== undefined) session.isClosed = isClosed;
    if (note !== undefined) session.note = note;

    await card.save();

    return res.status(200).json({
      success: true,
      message: "Treatment session updated.",
      billing: card.billing,
      outstandingBalance: card.outstandingBalance,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update treatment session.",
      error: error.message,
    });
  }
}

/**
 * @desc    Close a specific Treatment Session
 * @route   PATCH /api/patient-cards/:id/billing/sessions/:sessionId/close
 * @access  Private (Doctor / Admin)
 */
export async function closeTreatmentSession(req: Request, res: Response) {
  try {
    const { id, sessionId } = req.params as { id: string; sessionId: string };

    const card = await PatientCard.findById(id);
    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    const session = (card.billing.sessions as any).id(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Treatment session not found." });
    }

    if (session.isClosed) {
      return res.status(400).json({ message: "Treatment session is already closed." });
    }

    session.isClosed = true;
    await card.save();

    return res.status(200).json({
      success: true,
      message: "Treatment session closed successfully.",
      billing: card.billing,
      outstandingBalance: card.outstandingBalance,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to close treatment session.",
      error: error.message,
    });
  }
}


/**
 * @desc    Record a Billing Payment (Cash, Card, Transfer)
 * @route   POST /api/patient-cards/:id/billing/payments
 * @access  Private (Accountant / Staff / Admin)
 */
export async function recordPayment(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { amount, sessionId, reference, paymentMethod, note } = req.body as {
      amount: number;
      sessionId?: string;
      reference?: string;
      paymentMethod?: "cash" | "transfer" | "pos";
      note?: string;
    };
    const recordedBy = req.user?._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than zero.",
      });
    }

    const card = await PatientCard.findById(id);
    if (!card) {
      return res.status(404).json({ message: "Patient card not found." });
    }

    // 1. Calculate total cost of all treatment sessions
    const totalCost = card.billing.sessions.reduce(
      (sum, session) => sum + (session.cost || 0),
      0
    );

    // 2. Calculate total payments made so far
    const totalPaidSoFar = card.billing.paymentHistory.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );

    // 3. Calculate remaining balance
    const remainingBalance = totalCost - totalPaidSoFar;

    // 4. Check if the incoming payment exceeds the remaining balance
    if (amount > remainingBalance) {
      return res.status(400).json({
        message: `Payment amount (${amount}) exceeds the remaining balance (${remainingBalance > 0 ? remainingBalance : 0}).`,
      });
    }

    // Record the payment
    card.billing.paymentHistory.push({
      amount,
      sessionId: sessionId ? (sessionId as any) : undefined,
      date: new Date(),
      reference,
      paymentMethod: paymentMethod || "cash",
      recordedBy,
      note,
    });

    await card.save();

    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully.",
      billing: card.billing,
      outstandingBalance: card.outstandingBalance,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to record payment.",
      error: error.message,
    });
  }
}
export default {
  initializeCardPayment,
  verifyCardPayment,
  getMyPatientCards,
  getAllPatientCards,
  getPatientCardById,
  deletePatientCard,
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
};
