import { ISignup } from "../auth/auth.interface";
import { IAdmin } from "../admin/admin.interface";

export interface IPickupAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface IBrand
  extends IAdmin, ISignup {
  brandName: string;
  brandLogo: string[] | null | undefined;
  brandStory: string;
  theme: string;
  stripe_accounts_id: string;
  pickupAddress?: IPickupAddress;
  pickupAddressCode?: number;
}

export type TBrandUpdate = Partial<IBrand> & {
  brandId: string;
};
