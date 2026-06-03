import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { IBrand } from "./brand.interface";
// import NotificationServices from "../notification/notification.service";
import Brand from "./brand.model";
import NotificationService from "../notification/notification.service";
import { NotificationType } from "../notification/notification.interface";
import { idConverter } from "../../utility/idConverter";

const getBrand: RequestHandler = catchAsync(async (req, res) => {
  // if (!req.user) {
  //   throw new AppError(httpStatus.BAD_REQUEST, "Authenticate User/Brand is required", "");
  // }

  const result = await GenericService.findAllResources<IBrand>(
    Brand,
    req.query,
    [],
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve brand data",
    data: result,
  });
});

const updateBrand: RequestHandler = catchAsync(async (req, res) => {
  if (req.user.role !== "Brand") {
    throw new AppError(httpStatus.UNAUTHORIZED, "Brand not authenticated", "");
  }

  const brandId = req.user?._id;
  const result = await GenericService.updateResources<IBrand>(
    Brand,
    brandId,
    req.body.data,
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Admin._id.toString(),
  //     message: `Admin profile updated`,
  //   },
  //   receiverId: [req.user?._id],
  //   notifyAdmin: true,
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated admin profile",
    data: result,
  });
});

const deleteBrand: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Brand not authenticated");
  }

  if (req.user.role !== "Brand" && req.user.role !== "Admin") {
    throw new AppError(httpStatus.FORBIDDEN, "Admin/Brand access required");
  }

  const brandId = await idConverter(req.params.id);

  const result = await GenericService.updateResources<IBrand>(Brand, brandId, {
    isDeleted: true,
  });

  // Send notification to deleted user
  await NotificationService.sendNotification({
    ownerId: req.user._id,
    receiverId: [brandId],
    type: NotificationType.SYSTEM,
    title: "Account Deleted",
    body: "Your account has been deleted by administrator",
    data: { brandId: brandId.toString() },
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully deleted brand  ",
    data: result,
  });
});

const BrandController = {
  getBrand,
  updateBrand,
  deleteBrand,
};

export default BrandController;
