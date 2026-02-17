import Stripe from "stripe";
import config from "../config";

const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: "2025-10-29.clover",
});

export default stripe;
