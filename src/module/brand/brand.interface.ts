import { ISignup } from "../auth/auth.interface";
import { IAdmin } from "../admin/admin.interface";

export interface IBrand
  extends IAdmin, ISignup {
  brandName: string;
  brandLogo: string[] | null | undefined;
  brandStory:string
  theme: string
}

export type TBrandUpdate = Partial<IBrand> & {
  brandId: string;
};
