import * as dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const connectDB = async (): Promise<void> => {
  const url = process.env.MONGO_URL as string;
  const maxRetries = 10;
  const delayMs = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(url, {});
      console.log("Connected to MongoDB");
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt}/${maxRetries} failed:`, (error as Error).message);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  console.error("MongoDB: all connection attempts failed — exiting");
  process.exit(1);
};

export default connectDB;
