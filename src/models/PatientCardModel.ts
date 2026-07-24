import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { SpecialtySlug } from "./specialitiesModel.js";

export type MaritalTypes = "single" | "married" | "divorced" | "widowed";
export interface IHistory {
  date: Date;
  note: string;
  author: Types.ObjectId;
}
export interface IPrescriptions {
  date: Date;
  product: string;
  dosage: string;
}

export interface IPatient extends Document {
  patient: Types.ObjectId;
  age: number;
  maritalStatus: MaritalTypes;
  nextOfKinName: string;
  nextOfKinPhone: string;
  stateOfOrigin?: string;
  specialty: SpecialtySlug;
  history: IHistory[];
  prescriptions: IPrescriptions[];
  isPaid: boolean;
  paymentReference?: string;
  cardFee: number;
  createdAt: Date;
  updatedAt: Date;
}

const HistorySchema = new Schema<IHistory>(
  {
    date: {
      type: Date,
      default: Date.now,
    },

    note: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: true },
);

const PrescriptionSchema = new Schema<IPrescriptions>(
  {
    date: {
      type: Date,
      default: Date.now,
    },

    product: {
      type: String,
      required: true,
      trim: true,
    },

    dosage: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true },
);

const PatientCardSchema: Schema<IPatient> = new Schema<IPatient>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    age: {
      type: Number,
      required: true,
      min: [0, "Age cannot be negative"],
    },

    maritalStatus: {
      type: String,
      required: true,
      enum: ["single", "married", "divorced", "widowed"],
      default: "single",
    },

    nextOfKinName: {
      type: String,
      required: true,
      trim: true,
    },

    nextOfKinPhone: {
      type: String,
      required: true,
      trim: true,
    },

    stateOfOrigin: {
      type: String,
      trim: true,
    },

    specialty: {
      type: String,
      required: true,
      trim: true,
      enum: [ "anti-natal", "post-natal", "labor-and-delivery", "stroke-recovery", "bone-setting", "infertility", "infection-treatment"],
      default: "anti-natal",
    },

    history:{ 
        type: [HistorySchema],
        default: [],
    },

    prescriptions:{ 
       type: [PrescriptionSchema],
       default: [],
    },

    isPaid: {
      type: Boolean,
      default: false,
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    cardFee: {
      type: Number,
      default: 10000,
    },
  },

  {
    timestamps: true,
  },
);

PatientCardSchema.index({patient: 1, specialty: 1}, {unique: true});

export const PatientCard: Model<IPatient> =
  mongoose.models.PatientCard ||
  mongoose.model<IPatient>("PatientCard", PatientCardSchema);

export default PatientCard;
