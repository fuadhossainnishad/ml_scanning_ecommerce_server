import mongoose from "mongoose";
import config from ".";

export const registerDBEventListener = async () => {
  mongoose.connection.on("connected", () => {
    console.log("MongoDb connected");
  });
  mongoose.connection.on("error", (err) => {
    console.log(`MongoDB connection error: ${err.message}`);
  });
  mongoose.connection.on("disconnected", async () => {
    console.log(`MongoDB disconnected. Attempting to reconnect...`);
    await dbConnection();
  });
};
export const dbConnection = async () => {
  try {
    await mongoose.connect(config.database_url!, {
      autoIndex: true,
    });
    console.log(" 🧹 MongoDB database connected....");
  } catch (error) {
    console.error("Failed to connect to mongoDB database:", error);
    throw error;
  }
};
