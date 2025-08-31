import httpStatus from "http-status";
import stripe from "../../app/config/stripe.config";
import AppError from "../../app/error/AppError";
import { ICreateFreeSubscription, IPaymentIntent, IWebhooks } from "./stripe.interface";
import { ISubscription } from "../subscription/subscription.interface";
import config from "../../app/config";
import Stripe from "stripe";

const createPaymentIntentService = async (payload: IPaymentIntent) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: payload.amount,
    currency: payload.currency || "usd",
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      subscriptionId: payload.subscriptionId,
      userId: payload.userId,
      stripe_customer_id: payload.stripe_customer_id
    },
  });
  if (!paymentIntent) {
    throw new AppError(
      httpStatus.NOT_IMPLEMENTED,
      "There is a problem on payment building"
    );
  }
  return { clientSecret: paymentIntent.client_secret };
};

const createStripeProductId = async (name: string, description: string): Promise<string> => {
  const product = await stripe.products.create({
    name,
    description
  })
  if (!product || !product.id) {
    throw new AppError(httpStatus.BAD_REQUEST, "Something error happened, try again later")

  }
  return product.id
}

const createStripePriceId = async (payload: ISubscription): Promise<string> => {
  const { price, interval, stripeProductId } = payload
  const stripe_price = await stripe.prices.create({
    unit_amount: price * 1000,
    currency: 'usd',
    recurring: { interval: interval },
    product: stripeProductId
  })
  if (!stripe_price || !stripe_price.id) {
    throw new AppError(httpStatus.BAD_REQUEST, "Something error happened, try again later")

  }
  return stripe_price.id
}

const createSubscription = async (payload: ICreateFreeSubscription) => {
  const stripeSubscription = await stripe.subscriptions.create({
    customer: payload.stripe_customer_id,
    items: [],
    trial_end: Math.floor(payload.trialEnd.getTime() / 1000),
    metadata: { id: payload._id.toString() },
  })
  if (!stripeSubscription || !stripeSubscription.id) {
    throw new AppError(httpStatus.BAD_REQUEST, "Something error happened, try again later")
  }
  return stripeSubscription.id;
}

export const handleStripeWebhook = async (payload: IWebhooks) => {
  const { rawbody, sig } = payload;
  const event = stripe.webhooks.constructEvent(
    rawbody,
    sig!,
    config.stripe.webHookSecret!
  );
  if (!event || event.type !== "payment_intent.succeeded") {
    throw new AppError(httpStatus.NOT_FOUND, "not webhook event have found");
  }
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  if (!paymentIntent || paymentIntent.status !== "succeeded") {
    throw new AppError(httpStatus.NOT_FOUND, "No payment intent found");
  }

  return { paymentIntent }

};

const StripeServices = {
  createPaymentIntentService,
  createStripeProductId,
  createStripePriceId,
  createSubscription,
  handleStripeWebhook
};
export default StripeServices;