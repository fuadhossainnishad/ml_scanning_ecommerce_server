import { model, Schema, Model } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IPayment } from "./payment.interface";

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true
    },
    stripeCustomerId: {
      type: String,
      required: true
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      required: true
    },
    paymentMethod: {
      type: String,
      required: true
    },
    metadata: {
      type: Object,
      default: {}
    },
    webhookProcessed: {
      type: Boolean,
      default: false
    },
    processedAt: {
      type: Date
    },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

PaymentSchema.index({ orderId: 1 }, { unique: true });
PaymentSchema.index({ paymentIntentId: 1 }, { unique: true });
PaymentSchema.index({ userId: 1, paymentStatus: 1 });
MongooseHelper.applyToJSONTransform(PaymentSchema);
MongooseHelper.findExistence(PaymentSchema);

const Payment: Model<IPayment> = model<IPayment>("Payment", PaymentSchema);

export default Payment;

