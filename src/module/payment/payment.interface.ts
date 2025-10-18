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


export interface ISaveCard {
    card_holder_name: string;
    card_number: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
    userId: Types.ObjectId;
    isDeleted: boolean;
}