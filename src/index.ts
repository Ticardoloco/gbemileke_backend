import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { setupSwagger } from "./config/swagger.js";
import userRouter from "./routes/userRoutes.js";
import bookRouter from "./routes/bookRoutes.js";
import specialitiesRouter from "./routes/specialitiesRoutes.js";
import patientCardRouter from "./routes/patientCardRoutes.js";
import productRouter from "./routes/productRoute.js";
import orderRouter from "./routes/orderRoutes.js";
import { connectDB } from "./config/database.js";

dotenv.config();

const app = express();

// 1. CORS Configuration - FIXED: Safely reject origins without throwing a 500 Express error
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:5002",
      "http://127.0.0.1:5002",
      "https://gbemileke-backend.vercel.app",
      "https://gbemileke-tradomedical.vercel.app",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman, Swagger UI, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Pass false instead of an Error object so CORS simply blocks it without throwing a 500 crash
        callback(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    credentials: true,
  })
);

// 2. Body Parsing Middleware
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// 3. Database Connection Middleware (Guarantees DB readiness per serverless request)
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection middleware failure:", err);
    next(err);
  }
});

// 4. Initialize Swagger
setupSwagger(app);

// 5. Routes
app.use("/api/user", userRouter);
app.use("/api/specialities", specialitiesRouter);
app.use("/api/bookings", bookRouter);
app.use("/api/patient-cards", patientCardRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);

// Root route
app.get("/", (_req, res) => {
  res.send("Gbemileke Hospital API is running...");
});

// Local Development Server Listener
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4005;
  app.listen(port, () => {
    console.log(`Gbemileke Hospital Server running on port ${port}`);
  });
}

// CRITICAL FOR VERCEL
export default app;