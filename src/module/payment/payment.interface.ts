import { Types } from "mongoose";

export interface IPayment {
    orderId: Types.ObjectId;
    userId: Types.ObjectId;
    stripeCustomerId: string;
    subscriptionId: Types.ObjectId;
    paymentIntentId: string,
    amount: number,
    currency: string,
    payment_method: string;
    payStatus: boolean;
    isDeleted: boolean
}

// export interface IPaymentUPdate extends IPayment {
//     orderId: Types.ObjectId;
// }
