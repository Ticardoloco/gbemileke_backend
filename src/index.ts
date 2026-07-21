import express from "express";
import dotenv from "dotenv"
import {setupSwagger} from "./config/swagger.js"
import  userRouter from "./routes/userRoutes.js"
import bookRouter from "./routes/bookRoutes.js"
import specialitiesRouter from "./routes/specialitiesRoutes.js"
import { connectDB } from "./config/database.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRouter);
app.use("/api/specialities", specialitiesRouter);
app.use("/api/bookings", bookRouter);

setupSwagger(app)

const port = process.env['PORT'] || 4005;



app.listen(port, ()=>{
    console.log(`Gbemileke Hospital Server processing on port ${port}`);
})

connectDB().catch((err)=>{
    console.log(err);
    
})