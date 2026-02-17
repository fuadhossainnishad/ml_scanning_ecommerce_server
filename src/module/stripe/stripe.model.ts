// import { Model, model, Schema } from "mongoose";
// import Subscription from "../subscription/subscription.model";
// import { TPaymentStatus } from "./stripe.interface";
// import { IPayment } from "../payment/payment.interface";

// const OrderSchema: Schema = new Schema({
//   subscriptionId: {
//     type: Schema.Types.ObjectId,
//     ref: Subscription,
//     required: true,
//   },
//   userId: {
//     type: Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   amount: {
//     type: Number,
//     required: true,
//   },
//   currency: {
//     type: String,
//     required: true,
//   },
//   method: {
//     type: String,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: Object.values(TPaymentStatus),
//     default: "pending",
//   },
// });

// const Order: Model<IPayment> = model<IPayment>("Order", OrderSchema);

// export default Order;
