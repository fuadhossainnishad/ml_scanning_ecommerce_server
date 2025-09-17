import { RequestHandlerWithFiles } from "../../types/express";
import catchAsync from "../../utility/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../utility/sendResponse";
import { RequestHandler } from "express";
// import BlogServices from "./settings.services";
// import AppError from "../../app/error/AppError";
import GenericService from "../../utility/genericService.helpers";
// import Blog from "./settings.model";
// import { idConverter } from "../../utility/idConverter";
// import NotificationServices from "../notification/notification.service";
import SettingsServices from "./settings.services";
import { ISettings } from "./settings.interface";
import Settings from "./settings.model";

const upsertSettings: RequestHandlerWithFiles = catchAsync(async (req, res) => {
  // console.log("Upsert Settings Inputs:", {
  //   body: req.body,
  //   files: req.files,
  //   user: req.user,
  //   headers: req.headers,
  // });

  // if (!req.user._id) {
  //   throw new AppError(httpStatus.NOT_FOUND, "Admin is required");
  // }
  // req.body.data.admin = req.user._id;

  const result = await SettingsServices.upsertSettingsIntoDb(req.body.data);

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.settings?._id.toString(),
  //     message: `${req.body?.type} upserted successfully`,
  //   },
  //   receiverId: [req.user?._id],
  //   notifyAdmin: true,
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully upserted Settings",
    data: result,
  });
});

const getSettings: RequestHandler = catchAsync(async (req, res) => {
  console.log(req.query)
  const result = await GenericService.findAllResources<ISettings>(
    Settings,
    req.query!,
    ["type", "content"]
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Successfully retrieved all settings",
    data: result,
  });
});

const SettingsController = {
  upsertSettings,
  getSettings,
};

export default SettingsController;
