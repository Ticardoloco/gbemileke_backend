import Book from "../models/bookModel.js";
import type { Request, Response } from "express";
import type { SpecialtySlug } from "../models/specialitiesModel.js";
import { count } from "node:console";
import mongoose from "mongoose";
import PatientCard from "../models/PatientCardModel.js";

export async function bookAppointment(req: Request, res: Response) {
  try {
    const { specialty, date, time, type, symptoms } = req.body as {
      specialty: SpecialtySlug;
      date: string;
      time: string;
      type: "In-person" | "Virtual";
      symptoms: string;
    };

    if (!specialty || !date || !time) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user no longer exists" });
    }

    // 1. Verify that the patient has an active paid card for this specific specialty
    const activeCard = await PatientCard.findOne({
      patient: req.user._id,
      specialty,
      isPaid: true,
    });

    if (!activeCard) {
      return res.status(403).json({
        message: `Booking failed. You must have an active registered card for ${specialty} to book an appointment.`,
      });
    }

    const booking = await Book.create({
      patient: req.user._id,
      specialty,
      date,
      time,
      type: type || "In-person",
      symptoms: symptoms || "",
    });

    return res.status(201).json({
      message: "Appointment booked successfully",
      booking,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getAppointments(req: Request, res: Response) {
  try {
    const appointments = await Book.find()
      .populate("patient", "fullName email phoneNumber gender")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Booking Appointments retrieved successfully",
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getAppointment(req: Request, res: Response) {
  try {
    const { id } = req.params as {
      id: string;
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const appointment = await Book.findById(id).populate(
      "patient",
      "fullName email phoneNumber gender",
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({
      message: "Appointment retrieved successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function getPatientAppointment(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user no longer exists" });
    }

    const appointments = await Book.find({ patient: req.user._id })
      .populate("patient", "fullName email phoneNumber gender")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Patient appointment retrieved successfully",
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function updateStatus(req: Request, res: Response) {
  try {
    const { id } = req.params as {
      id: string;
    };

    const { status, rejectionReason } = req.body as {
      status: "Pending" | "Approved" | "Completed" | "Rejected" | "Cancelled";
      rejectionReason: "string";
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const validStatuses = ["Pending", "Approved", "Completed", "Rejected", "Cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    if (status === "Rejected" && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        message: "A rejection reason is required when rejecting an appointment",
      });
    }

    const updatePayload: { status: string; rejectionReason?: string } = {
      status,
      rejectionReason: status === "Rejected" ? rejectionReason?.trim() : "",
    };



    const appointment = await Book.findByIdAndUpdate(id, updatePayload, {
      returnDocument: "after",
      runValidators: true,
    }).populate("patient", "fullName email phoneNumber gender");
    

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({
      message: "Appointment status updated successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export async function deleteAppointment(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID format" });
    }

    const appointment = await Book.findByIdAndDelete(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error });
  }
}

export default {
  bookAppointment,
  getAppointment,
  getAppointments,
  getPatientAppointment,
  updateStatus,
  deleteAppointment,
};
