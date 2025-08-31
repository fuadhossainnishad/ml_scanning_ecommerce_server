import { model, Schema, Model } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IPayment } from "./payment.interface";

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    stripeCustomerId: { type: String, required: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true },
    paymentIntentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    payStatus: { type: Boolean, required: true },
    payment_method: { type: String, required: true },
    isDeleted:{type:Boolean,default:false}
  },
  { timestamps: true }
);

MongooseHelper.applyToJSONTransform(PaymentSchema);
MongooseHelper.findExistence(PaymentSchema);

const Payment: Model<IPayment> = model<IPayment>("Payment", PaymentSchema);

export default Payment;

