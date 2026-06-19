import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import Report from "./report.model";
import { IReport } from "./report.interface";
import { idConverter } from "../../utility/idConverter";

const createReport: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  console.log("PostId: ", id.toString());

  if (!id && !req.user && req.user.role !== 'User' && req.user.role !== 'Brand') {
    throw new AppError(httpStatus.BAD_REQUEST, "PostId & Authencated User/Brand is required", "");
  }
  console.log("Report:", req.body.data);

  req.body.data.userId = req.user._id;
  req.body.data.postId = await idConverter(id);
  console.log("Report:", req.body.data);

  const result = await GenericService.insertResources<IReport>(Report, req.body.data);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully submit report data",
    data: result,
  });
});
// const getReport: RequestHandler = catchAsync(async (req, res) => {
//   const { id } = req.query;
//   console.log("ReportId: ", id!.toString());

//   // if (!productId || !req.user || req.user.role !== 'User') {
//   //   throw new AppError(httpStatus.BAD_REQUEST, "ProductId ID is required", "");
//   // }

//   if (!id) {
//     throw new AppError(httpStatus.BAD_REQUEST, "ReportId ID is required", "");
//   }

//   const result = await ReportServices.getReportService<IReport>(id as string, req.query);

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully retrieve Report data",
//     data: result,
//   });
// });

// const updateReport: RequestHandler = catchAsync(async (req, res) => {
//   if (!req.user) {
//     throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
//   }
//   const ReportId = req.user?._id;
//   console.log("userId: ", ReportId.toString());

//   if (!ReportId) {
//     throw new AppError(httpStatus.BAD_REQUEST, "ReportId is required", "");
//   }
//   req.body.data.ReportId = ReportId;
//   const result = await ReportServices.updateReportService(req.body.data);

//   await NotificationServices.sendNoification({
//     ownerId: req.user?._id,
//     key: "notification",
//     data: {
//       id: result.Report._id.toString(),
//       message: `Report profile updated`,
//     },
//     receiverId: [req.user?._id],
//     notifyReport: true,
//   });

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully updated Report profile",
//     data: result,
//   });
// });

const getAllReports: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<IReport>(Report, req.query, [])

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated Report profile",
    data: result,
  });
})

const ReportController = {
  createReport,
  // getReport,
  getAllReports
  // updateReport,
};

export default ReportController;
