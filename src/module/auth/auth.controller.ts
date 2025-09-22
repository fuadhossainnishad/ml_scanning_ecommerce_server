import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AuthServices from "./auth.services";
import httpStatus from "http-status";
import config from "../../app/config";
import sendResponse from "../../utility/sendResponse";
import AppError from "../../app/error/AppError";
import GenericService from "../../utility/genericService.helpers";
import User from '../user/user.model';
import { IUser } from "../user/user.interface";
import { IJwtPayload } from "./auth.interface";
import { IAdmin, TAdminUpdate } from '../admin/admin.interface';
import { IBrand } from "../brand/brand.interface";
import Admin from '../admin/admin.model';
import Brand from "../brand/brand.model";
import StripeUtils from "../../utility/stripe.utils";
import { idConverter } from "../../utility/idConverter";


export const signUp: RequestHandler = catchAsync(async (req, res) => {
  const { role, email } = req.body.data;
  const key = role.toLowerCase()
  console.log(email, role);

  if (role === 'User') {
    req.body.data.stripe_customer_id = await StripeUtils.CreateCustomerId(email)
  }

  let result
  switch (role) {
    case "Admin":
      result = await GenericService.insertResources<IAdmin>(Admin, req.body.data);
      break;
    case "Brand":
      result = await GenericService.insertResources<IBrand>(Brand, req.body.data);
      break;
    case "User":
      result = await GenericService.insertResources<IUser>(User, req.body.data);
      break;
    default:
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid role");
  }
  console.log("Signup result:", result[key]!);

  if (!result[key] || !result[key]._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Signup failed");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: `${role} registered successfully`,
    data: result[key],
  });
});

const login: RequestHandler = catchAsync(async (req, res) => {

  // await NotificationServices.sendNoification({
  //   ownerId: user._id,
  //   key: "notification",
  //   data: {
  //     id: result.user?._id.toString(),
  //     message: `User/vendor login`,
  //   },
  //   receiverId: [user._id],
  //   notifyAdmin: true,
  // });
  const user = await AuthServices.loginService(req.body.data);
  console.log(req.body.data!);

  const jwtPayload: IJwtPayload = {
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  };

  const token = await AuthServices.GenerateToken(jwtPayload);
  res.cookie("refreshToken", token.refreshToken, {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
  });



  return sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `${user.role} successfully login`,
    data: token,
  });


});

const requestForgotPassword: RequestHandler = catchAsync(async (req, res) => {
  const { email } = req.body.data || {};
  const result = await AuthServices.requestForgotPasswordService(email);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `OTP sent to your email:${email}`,
    data: result,
  });
});

const verifyOtp: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuthServices.verifyOtpService(req.body.data);
  const user = result
  const jwtPayload: IJwtPayload = {
    id: user.id!,
    role: user.role!,
    email: user.email!,
  };

  const token = await AuthServices.GenerateToken(jwtPayload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Otp verified successfully",
    data: token.accessToken,
  });
});

const resetPassword: RequestHandler = catchAsync(async (req, res) => {
  const { id, newPassword } = req.body.data
  const result = await AuthServices.resetPasswordService({ userId: id, newPassword: newPassword });
  // await NotificationServices.sendNoification({
  //   ownerId: result.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.user._id.toString(),
  //     message: `Password reset`,
  //   },
  //   receiverId: [result.user?._id],
  //   notifyAdmin: true,
  // });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password reset successfully",
    data: result,
  });
});
const updatePassword: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
  }
  const userId = req.user?._id;
  const result = await AuthServices.updatePasswordService({
    ...req.body.data,
    userId: userId?.toString(),
  });
  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.user._id.toString(),
  //     message: `Password updated`,
  //   },
  //   receiverId: [req.user?._id],
  //   notifyAdmin: true,
  // });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password updated successfully",
    data: result,
  });
});

const AuthController = {
  signUp,
  login,
  requestForgotPassword,
  verifyOtp,
  resetPassword,
  updatePassword,
};

export default AuthController;
