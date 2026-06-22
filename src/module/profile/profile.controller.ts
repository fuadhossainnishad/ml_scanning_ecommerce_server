import { RequestHandler } from "express";
import AppError from "../../app/error/AppError";
import httpStatus from "http-status";
import catchAsync from "../../utility/catchAsync";
import sendResponse from "../../utility/sendResponse";
import ProfileServices from "./profile.services";
import NotificationService from "../notification/notification.service";
import { NotificationType } from "../notification/notification.interface";
import { idConverter } from "../../utility/idConverter";
import GenericService from "../../utility/genericService.helpers";
import BlockProfile from "./block.model";
import { IBlockProfile } from "./block.interface";

const getProfile: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated user is required",
      "",
    );
  }

  const result = await ProfileServices.getProfileService(req);
  await NotificationService.sendNotification({
    ownerId: req.user._id,
    receiverId: [req.user._id],
    type: NotificationType.SYSTEM,
    title: "👋 Welcome Back!",
    body: `You fetch your profile successfully`,
    data: {
      userId: req.user._id.toString(),
      role: req.user.role,
      action: "login",
      loginTime: new Date().toISOString(),
    },
    notifyAdmin: false,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve profile data",
    data: result,
  });
});

const getProfile2: RequestHandler = catchAsync(async (req, res) => {
  // if (!req.user) {
  //     throw new AppError(
  //         httpStatus.BAD_REQUEST,
  //         "Authenticated user is required",
  //         ""
  //     );
  // }

  const result = await ProfileServices.getProfileService2(req);
  if (req.user?._id) {
    await NotificationService.sendNotification({
      ownerId: req.user?._id,
      receiverId: [req.user?._id],
      type: NotificationType.SYSTEM,
      title: "👋 Welcome Back!",
      body: `You fetch profile successfully`,
      data: {
        userId: req.user?._id.toString(),
        role: req.user?.role,
        action: "login",
        loginTime: new Date().toISOString(),
      },
      notifyAdmin: false,
    });
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve profile data",
    data: result,
  });
});

const blockProfile: RequestHandler = catchAsync(async (req, res) => {
  const { id: blockedId } = req.params;

  if (
    !req.user ||
    (req.user.role !== "User" && req.user.role !== "Brand")
  ) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Authenticated User/Brand is required",
      ""
    );
  }

  if (!blockedId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Blocked user id is required", "");
  }

  if (req.user._id.toString() === blockedId) {
    throw new AppError(httpStatus.BAD_REQUEST, "You cannot block yourself", "");
  }

  const payload = {
    blockerId: await idConverter(req.user._id),
    blockedId: await idConverter(blockedId),
    createdAt: new Date()
  };

  const result = await GenericService.insertResources<IBlockProfile>(
    BlockProfile,
    payload
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Profile blocked successfully",
    data: result,
  });
});
const unblockProfile: RequestHandler = catchAsync(async (req, res) => {
  const { id: blockedId } = req.params;

  if (
    !req.user ||
    (req.user.role !== "User" && req.user.role !== "Brand")
  ) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Authenticated User/Brand is required",
      ""
    );
  }

  if (!blockedId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Blocked user id is required", "");
  }

  const blockerId = req.user._id;

  const result = await BlockProfile.findOneAndDelete({
    blockerId,
    blockedId: await idConverter(blockedId),
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Block relation not found", "");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile unblocked successfully",
    data: result,
  });
});

const getBlockProfile: RequestHandler = catchAsync(async (req, res) => {
  if (
    !req.user ||
    (req.user.role !== "User" && req.user.role !== "Brand")
  ) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "Authenticated User/Brand is required",
      ""
    );
  }

  const result = await ProfileServices.getBlockedProfilesService(req);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Blocked profiles retrieved successfully",
    data: result.data,
  });
});

const ProfileController = {
  getProfile,
  getProfile2,
  blockProfile,
  unblockProfile,
  getBlockProfile
};

export default ProfileController;
