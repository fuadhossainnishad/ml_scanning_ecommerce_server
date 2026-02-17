import { Document } from "mongoose";
import { ISignup } from "../auth/auth.interface";

export interface IAdmin
  extends Omit<ISignup, "firstName" | "lastName"> {
  comparePassword(plainPassword: string): Promise<boolean>;
  isDeleted: boolean;
}
export interface IRecentActivity extends Document {
  title: string;
}

export interface IReport extends Document {
  title: string;
}

export type TAdminUpdate = Partial<IAdmin> & {
  id: string;
};
