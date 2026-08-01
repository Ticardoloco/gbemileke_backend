import dns from 'node:dns';
import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import {setupSwagger} from "./config/swagger.js";
import  userRouter from "./routes/userRoutes.js";
import bookRouter from "./routes/bookRoutes.js";
import specialitiesRouter from "./routes/specialitiesRoutes.js";
import patientCardRouter from "./routes/patientCardRoutes.js"
import productRouter from "./routes/productRoute.js"
import orderRouter from "./routes/orderRoutes.js"
import { connectDB } from "./config/database.js";

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();

// 1. Enable CORS for all routes and preflight requests upfront
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
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

app.use("/api/user", userRouter);
app.use("/api/specialities", specialitiesRouter);
app.use("/api/bookings", bookRouter);
app.use("/api/patient-cards", patientCardRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);


setupSwagger(app)

const port = process.env['PORT'] || 4005;



app.listen(port, ()=>{
    console.log(`Gbemileke Hospital Server processing on port ${port}`);
})

connectDB().catch((err)=>{
    console.log(err);
    
})