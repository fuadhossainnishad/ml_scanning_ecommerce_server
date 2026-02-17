// user/user.controller.ts
import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import User from "./user.model";
import { IUser } from "./user.interface";
import { idConverter } from "../../utility/idConverter";
import Admin from "../admin/admin.model";
import NotificationService from "../notification/notification.service";
import { NotificationType } from "../notification/notification.interface";

const getUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<IUser>(User, req.query, [
    "email",
    "userName",
    "sub",
  ]);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrieve users",
    data: result,
  });
});

const updateUser: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  req.body.data._id = req.user._id;
  const result = await GenericService.updateResources<IUser>(
    User,
    req.user._id,
    req.body.data
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully updated user profile",
    data: result,
  });
});

const deleteUser: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  if (req.user.role !== 'Admin') {
    throw new AppError(httpStatus.FORBIDDEN, "Admin access required");
  }

  const userId = await idConverter(req.params.id);

  const result = await GenericService.updateResources<IUser>(
    User,
    userId,
    { isDeleted: true }
  );

  // Send notification to deleted user
  await NotificationService.sendNotification({
    ownerId: req.user._id,
    receiverId: [userId],
    type: NotificationType.SYSTEM,
    title: "Account Deleted",
    body: "Your account has been deleted by administrator",
    data: { userId: userId.toString() }
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully deleted user",
    data: result,
  });
});

// Register FCM Token
const registerFCMToken: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const { token, device } = req.body.data || req.body;
  console.log("fcm register:", req.body.data)
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, "FCM token is required");
  }

  const user = await Admin.findById(req.user._id);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const tokenExists = user.fcmTokens?.some((t: any) => t.token === token);

  if (!tokenExists) {
    await Admin.findByIdAndUpdate(req.user._id, {
      $push: {
        fcmTokens: {
          token,
          device: device || 'android',
          addedAt: new Date()
        }
      }
    });

    console.log(`✅ FCM token registered for ${req.user.role} ${req.user._id}`);
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "FCM token registered successfully",
    data: 'fcm registered'
  });
});

// Remove FCM Token
const removeFCMToken: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  const { token } = req.body.data || req.body;
  console.log("fcm register:", req.body.data)

  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, "FCM token is required");
  }

  await Admin.findByIdAndUpdate(req.user._id, {
    $pull: { fcmTokens: { token } }
  });

  console.log(`✅ FCM token removed for ${req.user.role} ${req.user._id}`);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "FCM token removed successfully",
    data: 'fcm removed'
  });
});

const UserController = {
  getUser,
  updateUser,
  deleteUser,
  registerFCMToken,
  removeFCMToken
};

export default UserController;