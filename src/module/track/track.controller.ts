import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import NotificationServices from "../notification/notification.service";
import Track from "./track.model";
import { TTrack } from "./track.interface";
import { idConverter } from "../../utility/idConverter";

const insertTrack: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.insertResources<TTrack>(
    Track,
    req.body.data
  );
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Track data not inserted", "");
  }
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve track data",
    data: result,
  });
});

const getTrack: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<TTrack>(
    Track,
    req.query,
    [
      "medpro",
      "weaponQualification",
      "physicalFitness",
      "rangeQualification",
      "counseling",
      "adminUser",
    ]
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve track data",
    data: result,
  });
});

const updateTrack: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
  }
  const adminId = req.user?._id;
  console.log("userId: ", adminId.toString());

  if (!adminId) {
    throw new AppError(httpStatus.BAD_REQUEST, "adminId is required", "");
  }
  req.body.data.adminId = adminId;
  const result = await GenericService.updateResources(
    Track,
    await idConverter(req.params.id),
    req.body.data
  );

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



const TrackController = {
  insertTrack,
  getTrack,
  updateTrack,
};

export default TrackController;
