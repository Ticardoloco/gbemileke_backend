import mongoose from "mongoose";
export const connectDB = async (): Promise<void> =>{
    try {
        const mongoUrl = process.env["MONGODB_URL"];

        if (!mongoUrl) {
           throw new Error("MONGODB URL is not defined in the variable enviroment"); 
        };

        await mongoose.connect(mongoUrl);

        process.on("SIGINT", async()=>{
            await mongoose.connection.close();
            process.exit(1);
        });


    } catch (error) {
        console.log(`Failed to connect to mongoDB: ${error}`);
        
    }
}

export const disconnectDB = async (): Promise<void> =>{
    try {
        await mongoose.connection.close();
    } catch (error) {
        console.log(error);
    }
}