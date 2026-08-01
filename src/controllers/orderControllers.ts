import { Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Order, {
  IOrder,
  IOrderItem,
  IPaymentDetails,
  IShippingAddress,
} from "../models/orderModel";
import Product from "../models/productModel";
import axios from "axios";
import { authorize } from "../middleware/authMiddleware";

// Type definition for Paystack's external API response
interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Helper to calculate automated delivery fee based on region and order total
 */
function calculateDeliveryFee(state: string, itemsPrice: number): number {
  // Free delivery threshold (e.g., free shipping for orders ₦20,000 and above)
  if (itemsPrice >= 200000) {
    return 0;
  }

  const normalizedState = state ? state.trim().toLowerCase() : "";

  switch (normalizedState) {
    case "lagos":
      return 5000;
    case "osun":
    case "ondo":
    case "ogun":
    case "oyo":
    case "kwara":
    case "edo":
    case "ekiti":
      return 8000;
    case "rivers":
    case "kano":
    case "kaduna":
    case "enugu":
    case "delta":
    case "abia":
    case "adamawa":
    case "akwa ibom":
    case "cross river":
    case "delta":
    case "ebonyi":
    case "anambra":
    case "enugu":
    case "Gombe":
    case "imo":
    case "katsina":
    case "kogi":
    case "plateau":
    case "taraba":
    case "yobe":
    case "zamfara":
      return 12000;
    default:
      // Default rate for other states across Nigeria
      return 5000;
  }
}

/**
 * Helper to initialize Paystack transaction
 */
async function initializePaystackTransaction(
  email: string,
  amountInKobo: number
) {
  try {
    const response = await axios.post<PaystackInitResponse>(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Math.round(amountInKobo),
      },
      {
        headers: {
          Authorization: `Bearer ${process.env["PAYSTACK_SECRET_KEY"]}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.status) {
      throw new Error(
        response.data.message || "Paystack initialization failed."
      );
    }

    return response.data.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to initialize Paystack transaction.";
    throw new Error(errorMessage);
  }
}

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
export async function createOrder(req: Request, res: Response) {
  try {
    const { orderItems, shippingAddress, paymentInfo } = req.body as {
      orderItems: any[];
      shippingAddress: IShippingAddress;
      paymentInfo?: Partial<IPaymentDetails>;
    };

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No Order items provided" });
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phoneNumber ||
      !shippingAddress.streetAddress ||
      !shippingAddress.city ||
      !shippingAddress.state
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Shipping address must include fullName, phoneNumber, streetAddress, city, and state.",
      });
    }

    const userId = req.user?._id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    let itemsPrice = 0;
    const processedItems: IOrderItem[] = [];

    for (const item of orderItems) {
      const rawProductId =
        item.product || item.productId || item._id || item.id;

      if (!rawProductId || !mongoose.Types.ObjectId.isValid(rawProductId.toString())) {
        return res.status(400).json({
          success: false,
          message: `Invalid or missing product ID in item: ${JSON.stringify(item)}`,
        });
      }

      const dbProduct = await Product.findById(rawProductId);

      if (!dbProduct) {
        return res.status(404).json({
          success: false,
          message: `Product not found with ID: ${rawProductId}`,
        });
      }

      const quantity = Number(item.quantity) || 1;
      itemsPrice += dbProduct.price * quantity;

      // Ensure key is lowercase "product" and properly converted to ObjectId
      processedItems.push({
        product: new mongoose.Types.ObjectId(dbProduct._id.toString()),
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: quantity,
        image: item.image || dbProduct.image || "",
      });
    }

    const calculatedDeliveryFee = calculateDeliveryFee(
      shippingAddress.state,
      itemsPrice
    );

    const totalAmount = itemsPrice + calculatedDeliveryFee;

    if (totalAmount < 100) {
      return res.status(400).json({
        success: false,
        message: "Order total must be at least ₦100 to proceed with payment.",
      });
    }

    const paystackData = await initializePaystackTransaction(
      userEmail,
      totalAmount * 100
    );

    const order = await Order.create({
      user: userId,
      orderItems: processedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phoneNumber: shippingAddress.phoneNumber,
        streetAddress: shippingAddress.streetAddress,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country || "Nigeria",
      },
      itemsPrice,
      deliveryFee: calculatedDeliveryFee,
      totalAmount,
      paymentInfo: {
        paymentMethod: paymentInfo?.paymentMethod || "paystack",
        reference: paystackData.reference,
        accessCode: paystackData.access_code,
        authorizationUrl: paystackData.authorization_url,
        currency: "NGN",
        paystackStatus: "pending",
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        order,
        authorizationUrl: paystackData.authorization_url,
        accessCode: paystackData.access_code,
        reference: paystackData.reference,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to create order.",
      error: error.message,
    });
  }
}

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const order =
      ((await Order.findById(id).populate(
        "user",
        "fullName email phoneNumber"
      )) as IOrder) || null;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access." });
    }

    const isOwner = order.user._id.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order.",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching order.",
      error: error.message,
    });
  }
}

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/orders/me
 * @access  Private
 */
export async function getMyOrders(req: Request, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching user orders.",
      error: error.message,
    });
  }
}

/**
 * @desc    Get all orders across system with filtering options
 * @route   GET /api/orders
 * @access  Private (Admin / Staff)
 */
export async function getAllOrders(req: Request, res: Response) {
  try {
    const { status, isPaid, userId } = req.query;

    const filter: Record<string, any> = {};

    if (status) {
      filter.orderStatus = status;
    }

    if (isPaid !== undefined) {
      filter.isPaid = isPaid === "true";
    }

    if (userId) {
      filter.user = userId;
    }

    const orders = await Order.find(filter)
      .populate("user", "firstName email phoneNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving orders.",
      error: error.message,
    });
  }
}

/**
 * @desc    Update delivery fee (triggers custom updateDeliveryFee schema method)
 * @route   PUT /api/orders/:id/delivery-fee
 * @access  Private (Admin / Staff)
 */
export async function updateDeliveryFee(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { deliveryFee } = req.body as { deliveryFee: number };

    if (typeof deliveryFee !== "number" || deliveryFee < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid non-negative delivery fee is required.",
      });
    }

    const order = (await Order.findById(id)) as IOrder | null;

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const updatedOrder = await order.updateDeliveryFee(deliveryFee);

    return res.status(200).json({
      success: true,
      message: "Delivery fee updated successfully.",
      data: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to update delivery fee.",
      error: error.message,
    });
  }
}

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin / Staff)
 */
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { orderStatus } = req.body as {
      orderStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    };

    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(orderStatus)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order status." });
    }

    const order = (await Order.findById(id)) as IOrder | null;

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    order.orderStatus = orderStatus;
    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}.`,
      data: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
      error: error.message,
    });
  }
}

/**
 * @desc    Cancel an order (Customer Self-Service)
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export async function cancelOrder(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    const { cancellationReason } = req.body as { cancellationReason?: string };
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    // Verify ownership
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order.",
      });
    }

    // Block cancellation if order is already processed/shipped
    if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus}.`,
      });
    }

    // Handle Paystack Refund if the order was already paid
    if (order.isPaid && order.paymentInfo?.reference) {
      try {
        await axios.post(
          "https://api.paystack.co/refund",
          {
            transaction: order.paymentInfo.reference,
            customer_note: cancellationReason || "Customer requested order cancellation.",
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (refundError: any) {
        console.error("Paystack refund initiation failed:", refundError.response?.data || refundError.message);
      }
    }

    // Update local order status
    order.orderStatus = "cancelled";
    if (cancellationReason) {
      order.cancellationReason = cancellationReason;
    }

    const updatedOrder = await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: updatedOrder,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order.",
      error: error.message,
    });
  }
}

/**
 * @desc    Paystack Webhook Handler (Auto-confirms payment on charge.success)
 * @route   POST /api/orders/webhook/paystack
 * @access  Public (Validated via Paystack Signature)
 */
export async function handlePaystackWebhook(req: Request, res: Response) {
  try {
    const secret = process.env["PAYSTACK_SECRET_KEY"];
    const signature = req.headers["x-paystack-signature"];

    if (!secret || !signature) {
      return res.status(400).json({
        success: false,
        message: "Missing secret key or signature header",
      });
    }

    // Use rawBody buffer attached by express.json({ verify: ... }) in index.ts
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const { reference, channel, gateway_response } = event.data;

      const order = await Order.findOne({ "paymentInfo.reference": reference });

      if (order && !order.isPaid) {
        await order.markAsPaid(reference, channel, gateway_response);
      }
    }

    return res.status(200).json({ status: "success" });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Webhook processing error",
      error: error.message,
    });
  }
}
export default {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  updateDeliveryFee,
  updateOrderStatus,
  cancelOrder,
  handlePaystackWebhook,
};