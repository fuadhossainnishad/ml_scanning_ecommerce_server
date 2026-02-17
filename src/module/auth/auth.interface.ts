import { Types } from "mongoose";
import { TRole } from "../../types/express";

export const Role = ["User", "Brand", "Admin"] as const;

// export interface IAuthProvider extends Document {
//   sub: string;
//   authProviderName: string;
// }

export interface IFCMToken {
  token: string;
  device: 'ios' | 'android' | 'web';
  addedAt: Date;
}

export interface INotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  rewards: boolean;
  withdrawals: boolean;
}


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
  profile: string[],
  coverPhoto: string[],
  countryCode: string;
  mobile: string;
  confirmedPassword: string;
  role: TRole;
  passwordUpdatedAt?: Date
  last_login?: Date
  failed_attempts?: number
  stripe_customer_id: string;
  fcmTokens?: IFCMToken[];
  notificationSettings?: INotificationSettings;
  fcm?: string;
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
}
