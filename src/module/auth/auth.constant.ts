export type TSignin = {
  sub: string;
  email: string;
  password?: string;
};

export type TSignup = TSignin & {
  name: string;
};

export type TForgotPassword = {
  email: string;
};

export type TVerifyOtp = {
  email: string;
  otp: string;
};

export type TResetPassword = {
  userId: string;
  newPassword: string;
};

export type TUpdatePassword = TResetPassword & {
  oldPassword: string;
};
