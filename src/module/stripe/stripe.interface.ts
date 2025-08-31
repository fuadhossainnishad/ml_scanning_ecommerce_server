import { Types } from "mongoose";
export type TCheckout = {
  carId: string;
  vendorId: string;
  orderId: string;
  amount: number;
};

export interface IPaymentIntent {
  userId: string;
  subscriptionId: string;
  stripe_customer_id: string
  amount: number;
  currency: string;
}

export interface IWebhooks {
  sig: string;
  rawbody: Buffer;
}

export enum TPaymentStatus {
  pending = "pending",
  accept = "accept",
  reject = "reject",
}
// export interface IPayment {
//   subscriptionId: Types.ObjectId;
//   amount: number;
//   currency: string;
//   status: string;
//   method: string;
//   paymentIntentId: string;
// }

export interface ICreateFreeSubscription {
  _id: Types.ObjectId;
  stripe_customer_id: string;
  trialEnd: Date
}