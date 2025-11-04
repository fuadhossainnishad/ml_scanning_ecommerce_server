
export interface IPaymentIntent {
  userId: string;
  stripe_customer_id: string
  paymentMethodId: string
  amount: number;
  currency: string;
  orderId: string
  cartId: string
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