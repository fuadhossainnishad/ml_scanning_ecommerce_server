import { Subtype } from "aws-sdk/clients/connect";
import { Types } from "mongoose";

export interface IBase {
  stripe_subscription_id: string;
  length: number;
  start: Date;
  end: Date;
}
export interface ITrial extends IBase {
  active: boolean
}

export enum PaidStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  CANCELLED = "cancelled",
  PAST_DUE = "past_due",
  TRIALING = "trialing",
}

export enum SubType {
  NONE = "none",
  TRIAL = "trial",
  PAID = "paid",
}

export interface IPaid extends IBase {
  status: PaidStatus;
  subscription_id: Types.ObjectId;
}

export interface ISubscriptionPlan {
  trial: ITrial;
  trialUsed: boolean;
  paid: IPaid;
  subType: Subtype
  isActive: boolean;
}

export enum SubStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}
export enum IntervalType {
  MONTH = 'month',
}
export interface ISubscription {
  subscriptionName: string;
  shortDescription: string[];
  price: number;
  interval: IntervalType
  stripeProductId: string
  stripePriceId: string
  createdAt: Date;
  updatedAt: Date;
}
export type TSubscription = Partial<ISubscription>;

export type TSubscriptionUpdate = Partial<ISubscription> & {
  subscriptionId: string;
};

// export enum TBillingCycle {
//   FREE = "free",
//   MONTHLY = "monthly",
//   YEARLY = "yearly",
// }
