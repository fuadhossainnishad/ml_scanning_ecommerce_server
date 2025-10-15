import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import User from "./user.model";
import { IUser } from "./user.interface";
import { idConverter } from "../../utility/idConverter";
import NotificationServices from "../notification/notification.service";

// const getUser: RequestHandler = catchAsync(async (req, res) => {
//   const { userId } = req.query;
//   console.log("carId: ", userId!);

//   if (!userId || typeof userId !== "string") {
//     throw new AppError(httpStatus.BAD_REQUEST, "User ID is required", "");
//   }
//   const result = await GenericService.findResources<IUser>(
//     User,
//     await idConverter(userId)
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully retrieve user data",
//     data: result,
//   });
// });

const getUser: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<IUser>(User, req.query, [
    "email",
    "userName",
    "sub",
  ]);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve users",
    data: result,
  });
});

const updateUser: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
  }

  req.body.data._id = req.user?._id;
  const result = await GenericService.updateResources<IUser>(User, req.user?._id, req.body.data);

  // await NotificationServices.sendNoification({
  //   ownerId: await idConverter(req.body.data.userId),
  //   key: "notification",
  //   data: {
  //     id: userId,
  //     message: `User updated`,
  //   },
  //   receiverId: [userId],
  //   notifyAdmin: true,
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated user profile",
    data: result,
  });
});

const deleteUser: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
  }
  const admin = req.user?._id;
  console.log("adminId: ", admin.toString());

  if (!admin) {
    throw new AppError(httpStatus.BAD_REQUEST, "Admin ID is required", "");
  }
  const userId = await idConverter(req.params.id);
  console.log(req.params.id);

  const result = await GenericService.updateResources<IUser>(User, userId, req.body.data);

  await NotificationServices.sendNoification({
    ownerId: await idConverter(admin),
    key: "notification",
    data: {
      id: userId,
      message: `User deleted`,
    },
    receiverId: [userId],
    notifyAdmin: true,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully deleted user",
    data: result,
  });
});

const UserController = {
  getUser,
  updateUser,
  deleteUser,
};

export default UserController;
