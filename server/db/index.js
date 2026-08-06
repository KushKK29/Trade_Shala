import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/tradeshala";
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 }).catch(async (err) => {
            console.log("Primary MONGO_URI connection failed, falling back to local MongoDB...", err.message);
            await mongoose.connect("mongodb://localhost:27017/tradeshala");
        });
        console.log("MongoDB connected successfully");
    }
    catch (err) {
        console.log("MongoDB Connection Error:", err);
    }
}

export default connectDB;