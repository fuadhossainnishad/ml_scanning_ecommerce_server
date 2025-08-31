import { IAdmin } from "../admin/admin.interface";
import { ISignup } from "../auth/auth.interface";
import {
  ISubscriptionPlan,
  SubStatus,
} from "../subscription/subscription.interface";

export interface IUser extends ISignup, IAdmin {
  uic: string;
  rank: string;
  stripe_customer_id: string;
  sub_status: SubStatus;
  subscriptionPlan: ISubscriptionPlan;
  last_login: Date;
  failed_attempts?: number;
}

export type TUserUpdate = Partial<IUser> & {
  id: string;
};
