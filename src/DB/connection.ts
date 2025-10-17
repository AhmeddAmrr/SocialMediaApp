import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_URI as string, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`MongoDB connected: ${conn.connection.host} `);

    } catch (error) {
        console.log(`ERROR CONNECTING DB: ${(error as Error).message}`);

    }
}

export default connectDB;