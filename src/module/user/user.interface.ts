import { IAdmin } from "../admin/admin.interface";
import { ISignup } from "../auth/auth.interface";
export interface IUser extends ISignup, IAdmin {
  about: string;
  hometown: string;
  favouriteStyles: string[]
  stripe_customer_id: string;
}

export type TUserUpdate = Partial<IUser> & {
  id: string;
};
