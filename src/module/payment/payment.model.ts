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
      required: true
    },
    stripeCustomerId: {
      type: String,
      required: true
    },
    paymentIntentId: {
      type: String,
      required: true
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
      enum: ["pending", "succeded", "failed"],
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["card", "wallet", "paypal"],
      required: true
    },
    metadata: {
      type: Object,
      default: {}
    },

    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

MongooseHelper.applyToJSONTransform(PaymentSchema);
MongooseHelper.findExistence(PaymentSchema);

const Payment: Model<IPayment> = model<IPayment>("Payment", PaymentSchema);

export default Payment;

