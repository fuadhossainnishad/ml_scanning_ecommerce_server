import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
// import NotificationServices from "../notification/notification.service";
import Appointment from "./appointment.model";
import { IAppointment } from "./appointment.interface";
import { dateParse } from "../../utility/dayCount.utils";

const createAppointment: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  }
  const date = dateParse(req.body.data.date, req.body.data.time);
  if (!date) {
    throw new AppError(httpStatus.BAD_REQUEST, "Date/Time is required");
  }
  const result = await GenericService.insertResources<IAppointment>(
    Appointment,
    { ...req.body?.data, dateTime: date }
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Subsciption?._id.toString(),
  //     message: `New subsciption added`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully added new appointment",
    data: result,
  });
});

// const getAppointment: RequestHandler = catchAsync(async (req, res) => {
//   const { AppointmentId } = req.body.data;
//   console.log("AppointmentId: ", AppointmentId);

//   if (!AppointmentId) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Appointment ID is required",
//       ""
//     );
//   }
//   const result = await GenericService.findResources<IAppointment>(
//     Appointment,
//     await idConverter(AppointmentId)
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully retrieve Appointment data",
//     data: result,
//   });
// });

const getAllAppointment: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<IAppointment>(
    Appointment,
    req.query,
    ["date", "time", "details", "location","type"]
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "successfully retrieve appointment data",
    data: result,
  });
});

const updateAppointment: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  }
  const id = req?.params.id;

  // const id =
  //   typeof rawId === "string"
  //     ? rawId
  //     : Array.isArray(rawId) && typeof rawId[0] === "string"
  //       ? rawId[0]
  //       : undefined;

  const result = await GenericService.updateResources<IAppointment>(
    Appointment,
    await idConverter(id),
    req.body.data
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Appointment?._id.toString(),
  //     message: `An Appointment updated`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "successfully updated appointment ",
    data: result,
  });
});

const deleteAppointment: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
  }
  const { id } = req.params;
  const result = await GenericService.deleteResources<IAppointment>(
    Appointment,
    await idConverter(id)
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     message: `An Appointment deleted`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "successfully deleted appointment",
    data: result,
  });
});

const AppointmentController = {
  createAppointment,
  // getAppointment,
  getAllAppointment,
  updateAppointment,
  deleteAppointment,
};

export default AppointmentController;
