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
        callback_url: `${process.env["FRONTEND_URL"]}/patient/card/verify`,
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
      age,
      maritalStatus,
      nextOfKinName,
      nextOfKinPhone,
      stateOfOrigin,
    } = req.body as {
      reference: string;
      specialty: SpecialtySlug;
      age: number;
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
      if (age) card.age = age;
      if (maritalStatus) card.maritalStatus = maritalStatus;
      if (nextOfKinName) card.nextOfKinName = nextOfKinName;
      if (nextOfKinPhone) card.nextOfKinPhone = nextOfKinPhone;
      if (stateOfOrigin) card.stateOfOrigin = stateOfOrigin;

      await card.save();
    } else {
      if (!age || !nextOfKinName || !nextOfKinPhone) {
        return res.status(400).json({
          message:
            "Age, next of kin name, and next of kin phone number are required for registration.",
        });
      }
      card = await PatientCard.create({
        patient: userId,
        specialty,
        age,
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
      .populate("history.author", "fullName role");

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
 * @desc    Add Medical History entry to Patient Card
 * @route   POST /api/patient-cards/:id/history
 * @access  Private (Doctor / Admin / Medical Staff)
 */

export async function addMedicalHistory(req: Request, res: Response) {
  try {
    const { id } = req.params as {
      id: string;
    };

    const { note } = req.body as { note: string };
    const authorId = req.user?._id;

    if (!note) {
      return res.status(400).json({ message: "Note field is required" });
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
  } catch (error) {
    return res.status(500).json({
      message: "Failed to add history.",
      error: (error as any).message,
    });
  }
}

/**
 * @desc    Update an existing Medical History entry in a Patient Card
 * @route   PUT /api/patient-cards/:id/history/:historyId
 * @access  Private (Doctor / Admin / Medical Staff)
 */
export async function updateMedicalHistory(req: Request, res: Response) {
  try {
    const { id, historyId } = req.params as { id: string; historyId: string };
    const { note } = req.body as { note?: string };

    if (!note) {
      return res.status(400).json({ message: "Note field is required to update history." });
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

export default {
  initializeCardPayment,
  verifyCardPayment,
  getMyPatientCards,
  getAllPatientCards,
  addMedicalHistory,
  updateMedicalHistory,
  addPrescription,
  updatePrescription
};
