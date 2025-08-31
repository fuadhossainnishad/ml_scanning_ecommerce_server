import AppError from "../../app/error/AppError";
import { IPayment } from "./payment.interface";
import Payment from "./payment.model";
import httpStatus from 'http-status';

const createPaymentService = async (payload: IPayment) => {
    const newPayment = await Payment.create(payload)
    if (!newPayment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not stored on database");
    }

    return { payment: newPayment };
}

const PaymentServices = {
    createPaymentService
}
export default PaymentServices

// const newPayment = await Payment.create({
//     orderId: await idConverter(orderId),
//     amount: paymentIntent.amount,
//     currency: paymentIntent.currency,
//     method: paymentIntent.payment_method,
//     paymentIntentId: paymentIntent.id,
// });

