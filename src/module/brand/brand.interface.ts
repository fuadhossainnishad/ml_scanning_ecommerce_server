import { Document } from "mongoose";
import { ISignup } from "../auth/auth.interface";
import { IAdmin } from "../admin/admin.interface";

export interface IBrand
  extends IAdmin, ISignup {
  brandName: string;
  brandLogo: string[] | null | undefined;
  theme: string
}

export interface IRecentActivity extends Document {
  title: string;
}

export interface IReport extends Document {
  title: string;
}

export type TBrandUpdate = Partial<IBrand> & {
  brandId: string;
};
