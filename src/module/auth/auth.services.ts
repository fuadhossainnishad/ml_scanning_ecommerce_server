import httpStatus from "http-status";
import AppError from "../../app/error/AppError";
import { sendMail } from "../../app/mailer/sendMail";
import { emailRegex } from "../../constants/regex.constants";
import { idConverter } from "../../utility/idConverter";
import { IJwtPayload, ISignIn } from "./auth.interface";
import { TResetPassword, TUpdatePassword, TVerifyOtp } from "./auth.constant";
import Otp from "./auth.model";
import config from "../../app/config";
import { jwtHelpers } from "../../app/jwtHelpers/jwtHelpers";
import Admin from "../admin/admin.model";

const loginService = async (payload: ISignIn) => {

  if (!payload.email || !payload.password) {
    throw new AppError(httpStatus.NOT_FOUND, "Email already exist", "");
  }

  console.log(payload);

  const QueryModel = Admin;
  const query: Record<string, unknown> = { email: payload.email };

  // if (payload.sub) {
  //   query["sub"] = payload.sub;
  //   query["authProviderName"] = payload.authProviderName;
  // }

  const isExist = await QueryModel.findOne(query, {
    _id: 1,
    password: 1,
    email: 1,
    role: 1,
  });

  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, `${payload.email} not found`, "");
  }

  const isPasswordValid = await isExist.comparePassword(payload.password);

  if (!isPasswordValid) {
    throw new AppError(httpStatus.FORBIDDEN, "This Password Not Matched", "");
  }

  console.log("isUserExist: ", isExist);

  return isExist;
};

const requestForgotPasswordService = async (email: string) => {
  console.log("email: ", email);

  if (!emailRegex.test(email)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid email format", "");
  }

  const QueryModel = Admin;

  const user = await QueryModel.findOne({ email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Email not registered before", "");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.deleteMany({ email });

  const subject = "forgot password";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Use the following OTP to reset your password:</p>
      <h3 style="background: #f0f0f0; padding: 10px; display: inline-block;">${otp}</h3>
      <p>This code expires in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  try {
    await sendMail(email, subject, html);

    const result = await Otp.create({
      email,
      otp,
      expiresAt,
    });

    return {
      email: result.email,
      otp: otp,
      expiresAt: result.expiresAt,
    };
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to process password reset request",
      error as string
    );
  }
};

const verifyOtpService = async (payload: TVerifyOtp) => {
  const otpRecord = await Otp.findOne({
    email: payload.email,
    otp: payload.otp,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP", "");
  }
  const QueryModel = Admin;
  if (!QueryModel) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid role provided", "");
  }

  const user = await QueryModel?.findOne({ email: payload.email });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Email not registered", "");
  }



  await Otp.deleteOne({ _id: otpRecord._id });

  return { user: user };
};

const resetPasswordService = async (payload: TResetPassword) => {
  const { userId, newPassword } = payload;
  console.log(userId);

  const userIdObject = await idConverter(userId!);
  const QueryModel = Admin;
  const user = await QueryModel.findOne(
    { _id: userIdObject, isDeleted: { $ne: true } },
    { password: 1, email: 1 }
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found", "");
  }

  const updatedUser = await QueryModel.findOneAndUpdate(
    { _id: userIdObject, isDeleted: { $ne: true } },
    { password: newPassword },
    { new: true }
  ).select("-password");

  if (!updatedUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Failed to reset password", "");
  }

  return { user: updatedUser };
};

const updatePasswordService = async (payload: TUpdatePassword) => {
  const { userId, oldPassword, newPassword } = payload;
  console.log(userId);

  const userIdObject = await idConverter(userId!);
  const QueryModel = Admin;
  const user = await QueryModel.findOne(
    { _id: userIdObject, isDeleted: { $ne: true } },
    { password: 1, email: 1 }
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found", "");
  }

  const isPasswordValid = await user.comparePassword(oldPassword);

  if (!isPasswordValid) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Current password is incorrect",
      ""
    );
  }

  const updatedUser = await QueryModel.findOneAndUpdate(
    { _id: userIdObject, isDeleted: { $ne: true } },
    { password: newPassword },
    { new: true }
  ).select("-password");

  if (!updatedUser) {
    throw new AppError(httpStatus.NOT_FOUND, "Failed to update password", "");
  }

  return { user: updatedUser };
};

const GenerateToken = async (payload: IJwtPayload) => {

  const accessToken = jwtHelpers.generateToken(
    payload,
    config.jwt_access_secret as string,
    config.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    payload,
    config.jwt_refresh_secret as string,
    config.refresh_expires_in as string
  );

  if (!accessToken || !refreshToken) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Token generation failed", "");
  }

  return { accessToken, refreshToken };
}


const AuthServices = {
  loginService,
  requestForgotPasswordService,
  verifyOtpService,
  resetPasswordService,
  updatePasswordService,
  GenerateToken
};

export default AuthServices;
