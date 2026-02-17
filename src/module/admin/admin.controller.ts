import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
import Admin from "./admin.model";
import { IAdmin } from "./admin.interface";

const getAdmin: RequestHandler = catchAsync(async (req, res) => {
  const { _id } = req.user;
  console.log("adminId: ", _id);

  if (!_id) {
    throw new AppError(httpStatus.BAD_REQUEST, "Admin ID is required", "");
  }
  const result = await GenericService.findResources<IAdmin>(
    Admin,
    await idConverter(_id)
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve admin data",
    data: result,
  });
});

const updateAdmin: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user || req.user.role !== 'Admin') {
    throw new AppError(httpStatus.UNAUTHORIZED, "Only admin can access", "");
  }

  if (!req.body || !req.body.data) {
    throw new AppError(httpStatus.BAD_REQUEST, "Data is required", "");
  }


  console.log(req.body.data!);


  const adminId = req.user?._id;
  console.log("userId: ", adminId.toString());

  if (!adminId) {
    throw new AppError(httpStatus.BAD_REQUEST, "adminId is required", "");
  }

  if (!req.body.data.profile || req.body.data.profile.length === 0) {
    console.log("No profile file uploaded");
    req.body.data.profile = '';
  }

  const result = await GenericService.updateResources<IAdmin>(Admin, adminId, req.body.data!);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Successfully updated admin profile",
    data: result,
  });
});

const AdminController = {
  getAdmin,
  updateAdmin,
};

export default AdminController;
