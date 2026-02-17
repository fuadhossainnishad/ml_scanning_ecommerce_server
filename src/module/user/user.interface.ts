import { Types } from "mongoose";
import { IAdmin } from "../admin/admin.interface";
import { ISignup } from "../auth/auth.interface";
export interface IUser extends ISignup, IAdmin {
  about: string;
  hometown: string;
  favouriteStyles: string[],
  theme:string
}

export type TUserUpdate = Partial<IUser> & {
  _id: Types.ObjectId;
};
