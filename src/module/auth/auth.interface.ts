import { Types } from "mongoose";
import { TRole } from "../../types/express";

export const Role = ["User", "Admin"] as const;

// export interface IAuthProvider extends Document {
//   sub: string;
//   authProviderName: string;
// }
export interface ISignIn {
  // isAuthProvider?: boolean;
  email: string;
  password: string;
  // sub?: string;
  // authProviderName?: string;
  // authProvider?: IAuthProvider[];
}
export interface ISignup extends ISignIn {
  firstName: string;
  lastName: string;
  userName: string;
  countryCode: string;
  mobile: string;
  confirmedPassword: string;
  role: TRole;
  // agreeTcp: boolean;
}

export interface IOtp {
  userId: Types.ObjectId;
  email: string;
  otp: string;
  expiresAt: Date;
}

export interface ISignUpBase extends ISignup {
  comparePassword(plainPassword: string): Promise<boolean>;
}

export interface IJwtPayload {
  id: string;
  role: string;
  email: string;
  sub_status?: string;
  subType?: string;
}
