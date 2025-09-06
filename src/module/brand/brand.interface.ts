import { Document } from "mongoose";
import { ISignup } from "../auth/auth.interface";

export interface IBrand
  extends Omit<ISignup, "firstName" | "lastName" | "userName"> {
  profile: string;
  brandName: string;
  contactNumber: string;
  comparePassword(plainPassword: string): Promise<boolean>;
  passwordUpdatedAt: Date;
  isDeleted: boolean;
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
