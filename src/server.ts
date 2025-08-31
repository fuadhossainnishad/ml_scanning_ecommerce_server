import { Server } from "http";
import { dbConnection, registerDBEventListener } from "./app/config/db.config";
import config from "./app/config";
import mongoose from "mongoose";
import { testS3 } from "./app/config/s3Bucket.config";
import { httpServer } from "./app";

let server: Server;

const startServer = async () => {
  server = httpServer.listen(config.port, () => {
    console.log(` 🚀 Server is running at http://localhost:${config.port}`);
  });
};

const shutdownServer = async (reason: string) => {
  console.log(`Shutting down due to ${reason}`);
  if (server) {
    server.close(() => {
      console.log("Server has closed");
    });
  }
  await mongoose.disconnect();
  console.log(" 💡 MongoDB database has disconnected");
  process.exit(1);
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  shutdownServer("Unhandled Rejection");
});

process.on("unhandledException", (error) => {
  console.error("Unhandled Exception:", error);
  shutdownServer("Unhandled Exception");
});

process.on("SIGTERM", () => shutdownServer("SIGTERM"));
process.on("SIGINT", () => shutdownServer("SIGINT"));

const bootstrap = async () => {
  await dbConnection();
  await testS3();
  await registerDBEventListener();
  await startServer();
};

bootstrap().catch((error) => {
  console.error("❌ Bootstrap failed:", error);
  shutdownServer("Bootstrap error");
});
