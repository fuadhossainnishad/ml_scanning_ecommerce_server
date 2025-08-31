import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
import Admin from "./admin.model";
import { IAdmin } from "./admin.interface";
import AdminServices from "./admin.services";
import NotificationServices from "../notification/notification.service";

const getAdmin: RequestHandler = catchAsync(async (req, res) => {
  const { adminId } = req.body.data;
  console.log("adminId: ", adminId.toString());

  if (!adminId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Admin ID is required", "");
  }
  const result = await GenericService.findResources<IAdmin>(
    Admin,
    await idConverter(adminId)
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve admin data",
    data: result,
  });
});

const updateAdmin: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
  }
  const adminId = req.user?._id;
  console.log("userId: ", adminId.toString());

  if (!adminId) {
    throw new AppError(httpStatus.BAD_REQUEST, "adminId is required", "");
  }
  req.body.data.adminId = adminId;
  const result = await AdminServices.updateAdminService(req.body.data);

  await NotificationServices.sendNoification({
    ownerId: req.user?._id,
    key: "notification",
    data: {
      id: result.Admin._id.toString(),
      message: `Admin profile updated`,
    },
    receiverId: [req.user?._id],
    notifyAdmin: true,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated admin profile",
    data: result,
  });
});

const AdminController = {
  getAdmin,
  updateAdmin,
};

export default AdminController;
