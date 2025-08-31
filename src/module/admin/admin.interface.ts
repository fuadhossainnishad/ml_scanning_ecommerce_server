import { Document } from "mongoose";
import { ISignup } from "../auth/auth.interface";

export interface IAdmin
  extends Omit<ISignup, "firstName" | "lastName" | "countryCode" | "mobile"> {
  profile: string;
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

export type TAdminUpdate = Partial<IAdmin> & {
  adminId: string;
};
