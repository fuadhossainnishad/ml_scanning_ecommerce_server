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
import { IAdmin } from '../admin/admin.interface';
import { IBrand } from "../brand/brand.interface";
import Admin from '../admin/admin.model';
import Brand from "../brand/brand.model";
import StripeUtils from "../../utility/stripe.utils";
import NotificationServices from "../notification/notification.service";
import Reward from "../reward/reward.model";


export const signUp: RequestHandler = catchAsync(async (req, res) => {
  const { role, email } = req.body.data;
  const key = role.toLowerCase()
  console.log(email, role);

  if (role !== 'Admin') {
    req.body.data.stripe_customer_id = await StripeUtils.CreateCustomerId(email)
  }

  if (role === 'Brand') {
    req.body.data.stripe_accounts_id = await StripeUtils.CreateStripeAccount(email, 'US', req.ip!, req.body.data.brandName);
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
  if (role === "User") {
    await Reward.findOneAndUpdate(
      { userId: result[key]._id },
      {
        $setOnInsert: {
          totalSpent: 0,
          reward: 0,
          rewardPrice: 0,
          rewardPending: false,
          isDeleted: false,
        },
      },
      { upsert: true }
    );
  }

  await NotificationServices.sendNoification({
    ownerId: result[key]._id,
    key: "notification",
    data: {
      id: result[key]._id.toString(),
      message: `${key} registered successfully`,
    },
    receiverId: [result[key]._id],
    notifyAdmin: true,
  });

  // req.body.data.orderUpdateData.userId = result[key]._id!
  // next()
  // const saveNotf = await NotificationServices()

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: `${role} registered successfully`,
    data: result[key],
  });
});

const login: RequestHandler = catchAsync(async (req, res) => {


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

  await NotificationServices.sendNoification({
    ownerId: user._id,
    key: "notification",
    data: {
      id: user?._id.toString(),
      message: `${user.role} successfully login`,
    },
    receiverId: [user._id],
    notifyAdmin: true,
  });



  return sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `${user.role} successfully login`,
    data: { ...token, role: user.role, id: user._id },
  });


});

const requestForgotPassword: RequestHandler = catchAsync(async (req, res) => {
  const { email } = req.body.data
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

  const jwtPayload: IJwtPayload = {
    id: result.user._id.toString()!,
    role: result.user.role!,
    email: result.user.email!,
  };

  const token = await AuthServices.GenerateToken(jwtPayload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Otp verified successfully",
    data: { accessToken: token.accessToken },
  });
});

const resetPassword: RequestHandler = catchAsync(async (req, res) => {
  const { _id } = req.user
  const { newPassword } = req.body.data || {}
  const result = await AuthServices.resetPasswordService({ userId: _id, newPassword: newPassword });
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
  const jwtPayload: IJwtPayload = {
    id: result.user._id.toString()!,
    role: result.user.role!,
    email: result.user.email!,
  };

  const token = await AuthServices.GenerateToken(jwtPayload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password reset successfully",
    data: token,
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

const updateFcm: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
  }
  const { _id } = req.user
  const { fcm } = req.body.data

  if (!fcm) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Fcm token needed for push notification", "");
  }

  const result = await GenericService.updateResources<IUser>(User, _id!, { fcm });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Fcm updated successfully",
    data: result,
  });
})

const AuthController = {
  signUp,
  login,
  requestForgotPassword,
  verifyOtp,
  resetPassword,
  updatePassword,
  updateFcm
};

export default AuthController;
