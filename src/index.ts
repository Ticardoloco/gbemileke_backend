// // import dns from 'node:dns';
// // import express from "express";
// // import dotenv from "dotenv";
// // import cors from "cors"
// // import {setupSwagger} from "./config/swagger.js";
// // import  userRouter from "./routes/userRoutes.js";
// // import bookRouter from "./routes/bookRoutes.js";
// // import specialitiesRouter from "./routes/specialitiesRoutes.js";
// // import patientCardRouter from "./routes/patientCardRoutes.js"
// // import productRouter from "./routes/productRoute.js"
// // import orderRouter from "./routes/orderRoutes.js"
// // import { connectDB } from "./config/database.js";

// // dns.setServers(['8.8.8.8', '8.8.4.4']);

// // dotenv.config();

// // const app = express();

// // // 1. Enable CORS for all routes and preflight requests upfront
// // app.use(
// //   cors({
// //     // origin: ["http://localhost:3000", "http://127.0.0.1:3000", " https://manly-duchess-ovary.ngrok-free.dev"],
// //     origin: [
// //       "http://localhost:3000",
// //       "http://127.0.0.1:3000",
// //       "http://localhost:5002",
// //       "http://127.0.0.1:5002",
// //       "https://gbemileke-backend.vercel.app",
// //     ],
// //     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
// //     allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
// //     credentials: true,
// //   })
// // );

// // app.use(
// //   express.json({
// //     verify: (req: any, _res, buf) => {
// //       req.rawBody = buf;
// //     },
// //   })
// // );
// // app.use(express.urlencoded({ extended: true }));

// // app.use("/api/user", userRouter);
// // app.use("/api/specialities", specialitiesRouter);
// // app.use("/api/bookings", bookRouter);
// // app.use("/api/patient-cards", patientCardRouter);
// // app.use("/api/products", productRouter);
// // app.use("/api/orders", orderRouter);


// // setupSwagger(app)

// // const port = process.env['PORT'] || 4005;



// // app.listen(port, ()=>{
// //     console.log(`Gbemileke Hospital Server processing on port ${port}`);
// // })

// // connectDB().catch((err)=>{
// //     console.log(err);
    
// // })




// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import { setupSwagger } from "./config/swagger.js";
// import userRouter from "./routes/userRoutes.js";
// import bookRouter from "./routes/bookRoutes.js";
// import specialitiesRouter from "./routes/specialitiesRoutes.js";
// import patientCardRouter from "./routes/patientCardRoutes.js";
// import productRouter from "./routes/productRoute.js";
// import orderRouter from "./routes/orderRoutes.js";
// import { connectDB } from "./config/database.js";

// dotenv.config();

// const app = express();

// // Set allowed origins dynamically via ENV, falling back to local/prod defaults
// const allowedOrigins = process.env.ALLOWED_ORIGINS
//   ? process.env.ALLOWED_ORIGINS.split(",")
//   : [
//       "http://localhost:3000",
//       "http://127.0.0.1:3000",
//       "https://gbemileke-backend.vercel.app",
//     ];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error(`CORS Policy: Origin ${origin} not allowed`));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// );

// app.use(
//   express.json({
//     verify: (req: any, _res, buf) => {
//       req.rawBody = buf;
//     },
//   })
// );
// app.use(express.urlencoded({ extended: true }));

// // Routes
// app.use("/api/user", userRouter);
// app.use("/api/specialities", specialitiesRouter);
// app.use("/api/bookings", bookRouter);
// app.use("/api/patient-cards", patientCardRouter);
// app.use("/api/products", productRouter);
// app.use("/api/orders", orderRouter);

// // Swagger Documentation (Consider disabling or protecting in production if sensitive)
// if (process.env.NODE_ENV !== "production") {
//   setupSwagger(app);
// }

// const port = process.env.PORT || 4005;

// // Initialize Database connection FIRST, then launch server
// async function startServer() {
//   try {
//     await connectDB();
//     console.log("Database connected successfully.");

//     app.listen(port, () => {
//       console.log(`Gbemileke Hospital Server running on port ${port}`);
//     });
//   } catch (error) {
//     console.error("Failed to start server due to DB connection error:", error);
//     process.exit(1);
//   }
// }

// startServer();

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

// Connect to Database for serverless environments
connectDB().catch((err) => {
  console.error("Database connection error:", err);
});

// Set allowed origins dynamically via ENV, falling back to local/prod defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://gbemileke-backend.vercel.app",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS Policy: Origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Initialize Swagger docs (ENABLED FOR ALL ENVIRONMENTS)
setupSwagger(app);

// Routes
app.use("/api/user", userRouter);
app.use("/api/specialities", specialitiesRouter);
app.use("/api/bookings", bookRouter);
app.use("/api/patient-cards", patientCardRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);

// Root route check
app.get("/", (_req, res) => {
  res.send("Gbemileke Hospital API is running...");
});

// Run app.listen ONLY for local development
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4005;
  app.listen(port, () => {
    console.log(`Gbemileke Hospital Server running on port ${port}`);
  });
}

// CRITICAL FOR VERCEL SERVERLESS DEPLOYMENT
export default app;