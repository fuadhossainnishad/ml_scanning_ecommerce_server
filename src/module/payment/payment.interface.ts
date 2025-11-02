import { Types } from "mongoose";

export interface IPayment {
    userId: Types.ObjectId;
    orderId: Types.ObjectId;
    stripeCustomerId: string;
    paymentIntentId: string,
    amount: number,
    currency: string,
    paymentStatus: string
    paymentMethod: string;
    metadata: Record<string, unknown>
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