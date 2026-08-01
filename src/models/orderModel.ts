import mongoose, { Schema, Model, Document } from "mongoose";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IShippingAddress {
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  city: string;
  state: string;
  country?: string;
}

export interface IPaymentDetails {
  paymentMethod: "paystack" | "card" | "bank_transfer";
  reference?: string;
  accessCode?: string;
  authorizationUrl?: string;
  channel?: string;
  currency: string;
  paidAt?: Date;
  paystackStatus?: string;
  gatewayResponse?: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentInfo: IPaymentDetails;
  itemsPrice: number;
  deliveryFee: number;
  totalAmount: number;
  isPaid: boolean;
  orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  cancellationReason?: string;
  cancelledAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  markAsPaid(
    reference: string,
    channel?: string,
    gatewayResponse?: string,
  ): Promise<IOrder>;
  updateDeliveryFee(newFee: number): Promise<IOrder>;
  cancelOrder(reason?: string): Promise<IOrder>;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },

    image: {
      type: String,
      default: "",
    },
  },
  { _id: true },
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    streetAddress: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },

    country: {
      type: String,
      default: "Nigeria",
      trim: true,
    },
  },
  { _id: false },
);

const paymentDetailsSchema = new Schema<IPaymentDetails>(
  {
    paymentMethod: {
      type: String,
      enum: ["paystack", "card", "bank_transfer"],
      default: "paystack",
      required: true,
    },
    reference: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    accessCode: { type: String, trim: true },
    authorizationUrl: { type: String, trim: true },
    channel: { type: String, trim: true },
    currency: { type: String, default: "NGN", uppercase: true },
    paidAt: { type: Date },
    paystackStatus: { type: String, trim: true, default: "pending" },
    gatewayResponse: { type: String, trim: true },
  },
  { _id: false },
);

const OrderSchema: Schema<IOrder> = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
      index: true,
    },

    orderItems: {
      type: [orderItemSchema],
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "Order items cannot be empty",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },

    paymentInfo: {
      type: paymentDetailsSchema,
      required: true,
      default: () => ({}),
    },

    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },

    deliveryFee: {
      type: Number,
      required: true,
      default: 0.0,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },

    isPaid: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },

    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },

    cancellationReason: {
      type: String,
      trim: true,
    },

    cancelledAt: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },
  },

  {
    timestamps: true,
  },
);

OrderSchema.pre("save", function () {
  if (this.isModified("itemsPrice") || this.isModified("deliveryFee")) {
    this.totalAmount = this.itemsPrice + this.deliveryFee;
  }
});

OrderSchema.index({ user: 1, isPaid: 1, createdAt: -1 });

OrderSchema.methods.markAsPaid = function (
  this: IOrder,
  reference: string,
  channel?: string,
  gatewayResponse?: string
): Promise<IOrder> {
  this.isPaid = true;
  this.orderStatus = "processing";
  this.paymentInfo.reference = reference;
  this.paymentInfo.paidAt = new Date();
  this.paymentInfo.paystackStatus = "success";
  if (channel) this.paymentInfo.channel = channel;
  if (gatewayResponse) this.paymentInfo.gatewayResponse = gatewayResponse;

  return this.save();
};

OrderSchema.methods.updateDeliveryFee = function (this: IOrder, newFee: number): Promise<IOrder> {
  if (newFee < 0) {
    throw new Error("Delivery fee cannot be negative");
  }
  this.deliveryFee = newFee;
  this.totalAmount = this.itemsPrice + this.deliveryFee;

  return this.save();
};

OrderSchema.methods.cancelOrder = function (
  this: IOrder,
  reason?: string
): Promise<IOrder> {
  this.orderStatus = "cancelled";
  this.cancelledAt = new Date();
  if (reason) {
    this.cancellationReason = reason;
  }

  return this.save();
};

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;

