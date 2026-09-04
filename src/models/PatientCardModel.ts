import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { SpecialtySlug } from "./specialitiesModel.js";

export type MaritalTypes = "single" | "married" | "divorced" | "widowed";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface IHistory {
  _id?: Types.ObjectId;
  date: Date;
  note: string;
  author: Types.ObjectId;
}

export interface IPrescriptions {
  _id?: Types.ObjectId;
  date: Date;
  product: string;
  dosage: string;
}

export interface IPaymentRecord {
  _id?: Types.ObjectId;
  sessionId?: Types.ObjectId;
  amount: number;
  date: Date;
  reference?: string;
  paymentMethod: "cash" | "transfer" | "pos";
  recordedBy?: Types.ObjectId;
  note?: string;
}

export interface ITreatmentSession {
  _id?: Types.ObjectId;
  title: string;
  cost: number;
  date: Date;
  isClosed?: boolean;
  createdBy?: Types.ObjectId;
  note?: string;
}

export interface IBilling {
  totalAmount: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  sessions: ITreatmentSession[];
  paymentHistory: IPaymentRecord[];
}

export interface IPatientCard extends Document {
  patient: Types.ObjectId;
  dateOfBirth: Date;
  readonly age: number;
  maritalStatus: MaritalTypes;
  nextOfKinName: string;
  nextOfKinPhone: string;
  stateOfOrigin?: string;
  specialty: SpecialtySlug;
  history: IHistory[];
  prescriptions: IPrescriptions[];
  billing: IBilling;
  readonly outstandingBalance: number;
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
  { _id: true }
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
  { _id: true }
);

const TreatmentSessionSchema = new Schema<ITreatmentSession>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const PaymentRecordSchema = new Schema<IPaymentRecord>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    reference: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "transfer", "pos"],
      default: "cash",
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const BillingSchema = new Schema<IBilling>(
  {
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "paid",
    },
    sessions: {
      type: [TreatmentSessionSchema],
      default: [],
    },
    paymentHistory: {
      type: [PaymentRecordSchema],
      default: [],
    },
  },
  { _id: false }
);

const PatientCardSchema: Schema<IPatientCard> = new Schema<IPatientCard>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
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
      enum: [
        "anti-natal",
        "post-natal",
        "labor-and-delivery",
        "stroke-recovery",
        "bone-setting",
        "infertility",
        "infection-treatment",
        "male-fertility-care",
        "general-tradomedical-care",
      ],
      default: "anti-natal",
    },

    history: {
      type: [HistorySchema],
      default: [],
    },

    prescriptions: {
      type: [PrescriptionSchema],
      default: [],
    },

    billing: {
      type: BillingSchema,
      default: () => ({
        totalAmount: 0,
        amountPaid: 0,
        paymentStatus: "paid",
        sessions: [],
        paymentHistory: [],
      }),
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Dynamic age calculation
PatientCardSchema.virtual("age").get(function (this: IPatientCard) {
  if (!this.dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});

// Dynamic outstanding balance calculation
PatientCardSchema.virtual("outstandingBalance").get(function (this: IPatientCard) {
  if (!this.billing) return 0;
  const balance = (this.billing.totalAmount || 0) - (this.billing.amountPaid || 0);
  return balance > 0 ? balance : 0;
});

// Pre-save hook: Auto-calculates billing aggregates
PatientCardSchema.pre("save", async function () {
  if (this.billing) {
    const totalSessionCost = (this.billing.sessions || []).reduce(
      (sum, session) => sum + (session.cost || 0),
      0
    );

    const totalPaid = (this.billing.paymentHistory || []).reduce(
      (sum, record) => sum + (record.amount || 0),
      0
    );

    this.billing.totalAmount = totalSessionCost;
    this.billing.amountPaid = totalPaid;

    if (totalSessionCost === 0) {
      this.billing.paymentStatus = "paid";
    } else if (totalPaid >= totalSessionCost) {
      this.billing.paymentStatus = "paid";
    } else if (totalPaid > 0) {
      this.billing.paymentStatus = "partial";
    } else {
      this.billing.paymentStatus = "unpaid";
    }
  }
});

PatientCardSchema.index({ patient: 1, specialty: 1 }, { unique: true });

export const PatientCard: Model<IPatientCard> =
  mongoose.models.PatientCard ||
  mongoose.model<IPatientCard>("PatientCard", PatientCardSchema);

export default PatientCard;