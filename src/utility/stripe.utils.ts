import stripe from "../app/config/stripe.config";
import AppError from "../app/error/AppError";
import httpStatus from 'http-status';
import { ICreateSubscription } from "../module/stripe/stripe.interface";
import Subscription from "../module/subscription/subscription.model";

const CreateCustomerId = async (email: string): Promise<string> => {
    const customer = await stripe.customers.create({
        email
    })
    if (!customer || !customer.id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Something error happened, try again later")
    }
    return customer.id;
}

const createSubscription = async (payload: ICreateSubscription) => {
    const { stripe_customer_id, trialEnd, userId } = payload;
    const createStripeSubscription = await stripe.subscriptions.create({
        customer: stripe_customer_id,
        items: [{
            price: Subscription

        }],
        metadata: { userId: userId.toString() },
    })
}

const StripeUtils = {
    CreateCustomerId
}
export default StripeUtils;