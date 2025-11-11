import express, { Request, Response } from "express";
import cors from "cors";
import router from "./router";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import notFound from "./middleware/notFound";
import globalErrorHandler from "./middleware/globalErrorHandler";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { socketio } from "./app/config/socketio.config";
import path from "path";
import PaymentController from "./module/payment/payment.controller";
import auth from "./middleware/auth";

const app = express();
// const allowedOrigins = ["http://192.168.56.1:3000", "*"];
const allowedOrigins = ["http://localhost:3000"];

export const httpServer = createServer(app);
socketio(httpServer);

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: false,
    message: "Too many requests, please try again later",
  },
});

app.use(express.static(path.resolve(__dirname, "../public/test.html")));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "http://localhost:3000"],
      },
    },
  })
);
app.use("/api", rateLimiter);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    // origin: process.env.NODE_ENV === "production" ? config.domain! : "*",
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

app.use("/src/uploads", express.static("./src/uploads"));

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, "../public/test.html"));
});
// app.get("/", (req: Request, res: Response) => {
//   res.send({
//     status: true,
//     message: "Welcome to this ecoomerce website",
//   });
// });



app.use("/api/v1", router);
app.post("/api/v1/payment-sheet", auth('User'), PaymentController.paymentIntent);


app.use(notFound);

app.use(globalErrorHandler);

export default app;
