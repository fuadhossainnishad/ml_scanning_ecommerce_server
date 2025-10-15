import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { IBrand } from "./brand.interface";
// import NotificationServices from "../notification/notification.service";
import Brand from "./brand.model";

const getBrand: RequestHandler = catchAsync(async (req, res) => {

  if (!req.user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Authenticate User/Brand is required", "");
  }

  const result = await GenericService.findAllResources<IBrand>(
    Brand,
    req.query,
    []
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
  const result = await GenericService.updateResources<IBrand>(Brand, brandId, req.body.data,);

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

const BrandController = {
  getBrand,
  updateBrand,
};

export default BrandController;
