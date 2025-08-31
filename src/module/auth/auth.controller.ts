import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AuthServices from "./auth.services";
import httpStatus from "http-status";
import config from "../../app/config";
import sendResponse from "../../utility/sendResponse";
import AppError from "../../app/error/AppError";
import GenericService from "../../utility/genericService.helpers";
import User from "../user/user.model";
import { IUser } from "../user/user.interface";
import { IJwtPayload } from "./auth.interface";

const signUp: RequestHandler = catchAsync(async (req, res) => {
  const { role } = req.body.data;

  // if (!email || !password) {
  //   throw new AppError(httpStatus.BAD_REQUEST, "Missing required fields", "");
  // }
  const result = await GenericService.insertResources<IUser>(
    User,
    req.body.data
  );

  console.log("register: ", result);
  if (!result.user || !result.user._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not found");
  }

  // await NotificationServices.sendNoification({
  //   ownerId: result.signUp._id!,
  //   key: "notification",
  //   data: {
  //     id: result.signUp?._id.toString(),
  //     message: `New user register`,
  //   },
  //   receiverId: [result.signUp._id],
  //   notifyAdmin: true,
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: `${role} is registered successfully`,
    data: result,
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
    sub_status: user.sub_status,
    subType: user.subscriptionPlan.subType,
  };

  const token = await AuthServices.GenerateToken(jwtPayload);
  res.cookie("refreshToken", token.refreshToken, {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
  });

  const getRedirectUrl = (subStatus: string, trialUsed: boolean) => {
    if (subStatus === "inactive" && !trialUsed) {
      return { message: "Please complete your trial subscription", redirect: "/trial" };
    }
    if (subStatus === "inactive" && trialUsed) {
      return { message: "Please complete your trial subscription", redirect: "/paid" };
    }
    return { message: "Successfully logged in", redirect: "/home" };
  };

  const redirectData = getRedirectUrl(user.sub_status, user.subscriptionPlan.trialUsed);

  return sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: redirectData.message,
    data: { token, redirectData },
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

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Otp verified successfully",
    data: result,
  });
});

const resetPassword: RequestHandler = catchAsync(async (req, res) => {
  const result = await AuthServices.resetPasswordService(req.body.data);
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
