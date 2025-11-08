import httpStatus from "http-status";
import stripe from "../../app/config/stripe.config";
import AppError from "../../app/error/AppError";
import { IPaymentIntent, IWebhooks } from "./stripe.interface";
import { ISubscription } from "../subscription/subscription.interface";
import config from "../../app/config";
import Stripe from "stripe";

const createPaymentIntentService = async (payload: IPaymentIntent) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(payload.amount * 100),
    currency: payload.currency || "usd",
    // automatic_payment_methods: {
    //   enabled: true,
    // },
    payment_method_types: ['card'],
    metadata: {
      userId: payload.userId,
      stripe_customer_id: payload.stripe_customer_id,
      orderId: payload.orderId,
      cartId: payload.cartId

    },
  });

  console.log("pay intent:", paymentIntent);

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

const CreateSetupIntent = async (customerId: string) => {
  const setupintent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card']
  })

  if (!setupintent) {
    throw new AppError(httpStatus.NOT_FOUND, "No setup intent found");
  }

  return { setupintent_client_secret: setupintent.client_secret }
}

const attachPaymentMethodService = async (data: {
  paymentMethodId: string;
  stripeCustomerId: string;
}) => {
  const { paymentMethodId, stripeCustomerId } = data;

  const customer = await stripe.customers.retrieve(stripeCustomerId);
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: stripeCustomerId,
  });

  // Optional: Set as default if needed
  // await stripe.customers.update(stripeCustomerId, {
  //   invoice_settings: { default_payment_method: paymentMethodId },
  // });

  return customer
}

const listPaymentMethodsService = async (data: { stripeCustomerId: string }) => {
  const { stripeCustomerId } = data;
  const paymentMethods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: 'card',
  });

  const formatted = paymentMethods.data.map(pm => ({
    id: pm.id,
    brand: pm.card?.brand,
    last4: pm.card?.last4,
    // exp_month: pm.card?.exp_month,
    // exp_year: pm.card?.exp_year,
    // isDefault: pm.id === (await stripe.customers.retrieve(stripeCustomerId)).invoice_settings?.default_payment_method,
  }));

  return formatted;
};

const createEphimeralKey = async (customer: string) => {
  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customer! },
    { apiVersion: '2025-10-29.clover' }
  );

  return ephemeralKey.secret
}

const createTransfer = async (amount: number, currency: string, acc_id: string) => {
  const transfer = await stripe.transfers.create({
    amount: Math.round(Number(amount) * 100),
    currency: currency || "usd",
    destination: acc_id,
    description: "Payment to Brand for completed order",
  });

  if (!transfer.id) {
    throw new AppError(httpStatus.NOT_FOUND, "Money transfer for the orderr failed");
  }

  return transfer.id
}

const StripeServices = {
  createPaymentIntentService,
  createStripeProductId,
  createStripePriceId,
  handleStripeWebhook,
  attachPaymentMethodService,
  listPaymentMethodsService,
  CreateSetupIntent,
  createEphimeralKey,
  createTransfer
};
export default StripeServices;