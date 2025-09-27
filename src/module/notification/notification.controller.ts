import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import GenericService from "../../utility/genericService.helpers";
import { INotification } from "./notification.interface";
import { idConverter } from "../../utility/idConverter";
import Notification from "./notification.model";
import sendResponse from "../../utility/sendResponse";

const getNotification: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.query;
  if (!id || typeof id !== "string") {
    throw new AppError(httpStatus.BAD_REQUEST, "ID is required", "");
  }
  const result = await GenericService.findResources<INotification>(
    Notification,
    await idConverter(id)
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve notification data",
    data: result,
  });
});

const getAllNotification: RequestHandler = catchAsync(async (req, res) => {
  // if (!req.user._id) {
  //   throw new AppError(404, "Id not found")
  // }



  const result = await GenericService.findAllResources<INotification>(
    Notification,
    req.query,
    []
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve notification data",
    data: result,
  });
});

const deleteNotification: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
  }
  const owner = req.user?._id;
  console.log("userId: ", owner.toString());

  if (!owner) {
    throw new AppError(httpStatus.BAD_REQUEST, "Vendor ID is required", "");
  }
  const result = await GenericService.deleteResources<INotification, "ownerId">(
    Notification,
    await idConverter(req.body.data.id),
    owner,
    "ownerId"
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve notification data",
    data: result,
  });
});

const NotificationController = {
  getNotification,
  getAllNotification,
  deleteNotification,
};

export default NotificationController;
