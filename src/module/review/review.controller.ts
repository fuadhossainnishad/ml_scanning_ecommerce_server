import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import ReviewServices from "./review.services";
import GenericService from "../../utility/genericService.helpers";
import Review from "./review.model";
import { IReview } from "./review.interface";
import { idConverter } from "../../utility/idConverter";

const createReview: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  console.log("ProductId: ", id.toString());

  if (!id || !req.user || req.user.role !== 'User') {
    throw new AppError(httpStatus.BAD_REQUEST, "ProductId & Authencated User is required", "");
  }
  console.log("review:", req.body.data);

  req.body.data.userId = req.user._id;
  req.body.data.productId = await idConverter(id);
  console.log("review:", req.body.data);

  const result = await GenericService.insertResources<IReview>(Review, req.body.data);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Review data",
    data: result,
  });
});
const getReview: RequestHandler = catchAsync(async (req, res) => {
  const { productId } = req.query;
  console.log("ReviewId: ", productId!.toString());

  if (!productId || !req.user || req.user.role !== 'User') {
    throw new AppError(httpStatus.BAD_REQUEST, "ProductId ID is required", "");
  }
  const result = await ReviewServices.getReviewService<IReview>(productId as string, req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Review data",
    data: result,
  });
});

// const updateReview: RequestHandler = catchAsync(async (req, res) => {
//   if (!req.user) {
//     throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
//   }
//   const ReviewId = req.user?._id;
//   console.log("userId: ", ReviewId.toString());

//   if (!ReviewId) {
//     throw new AppError(httpStatus.BAD_REQUEST, "ReviewId is required", "");
//   }
//   req.body.data.ReviewId = ReviewId;
//   const result = await ReviewServices.updateReviewService(req.body.data);

//   await NotificationServices.sendNoification({
//     ownerId: req.user?._id,
//     key: "notification",
//     data: {
//       id: result.Review._id.toString(),
//       message: `Review profile updated`,
//     },
//     receiverId: [req.user?._id],
//     notifyReview: true,
//   });

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully updated Review profile",
//     data: result,
//   });
// });

const getAllReviews: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<IReview>(Review, req.query, [])

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated Review profile",
    data: result,
  });
})

const ReviewController = {
  createReview,
  getReview,
  getAllReviews
  // updateReview,
};

export default ReviewController;
