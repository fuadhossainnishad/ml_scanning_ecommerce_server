import { RequestHandler } from "express";
import mongoose from "mongoose";

const healthController: RequestHandler = async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Ok" : "Down";
  res.status(200).json({ server: "Ok", dbStatus: dbStatus });
};

const Health = {
  healthController,
};
export default Health;
