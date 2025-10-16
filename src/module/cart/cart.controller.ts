import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import Cart from "./cart.model";
import CartServices from "./cart.services";
import NotificationServices from "../notification/notification.service";
import { ICart } from "./cart.interface";

const uploadCart: RequestHandler = catchAsync(async (req, res) => {

  if (!req.user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Authenticated user is required", "");
  }

  req.body.data.userId = req.user._id;
  console.log("Cart:", req.body.data);

  const cart: ICart = {
    userId: req.user._id,
    products: req.body.data,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await GenericService.insertResources<ICart>(
    Cart,
    cart
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully add to cart",
    data: result,
  });
});
const getCart: RequestHandler = catchAsync(async (req, res) => {

  if (!req.user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Authenticated user is required", "");
  }

  const query = { ...req.query, userId: req.user._id };

  const result = await GenericService.findAllResources<ICart>(
    Cart,
    query,
    ["userId", "productId"]
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Cart data",
    data: result,
  });
});

const updateCart: RequestHandler = catchAsync(async (req, res) => {

  if (!req.user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Authenticated user is required", "");
  }

  const query = { ...req.query, userId: req.user._id };

  const result = await GenericService.findAllResources<ICart>(
    Cart,
    query,
    ["userId", "productId"]
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Cart data",
    data: result,
  });
});

// const updateCart: RequestHandler = catchAsync(async (req, res) => {
//   if (!req.user) {
//     throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated", "");
//   }
//   const CartId = req.user?._id;
//   console.log("userId: ", CartId.toString());

//   if (!CartId) {
//     throw new AppError(httpStatus.BAD_REQUEST, "CartId is required", "");
//   }
//   req.body.data.CartId = CartId;
//   const result = await GenericService.updateResources(req.body.data);

//   // await NotificationServices.sendNoification({
//   //   ownerId: req.user?._id,
//   //   key: "notification",
//   //   data: {
//   //     id: result.Cart._id.toString(),
//   //     message: `Cart profile updated`,
//   //   },
//   //   receiverId: [req.user?._id],
//   //   notifyCart: true,
//   // });

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully updated Cart profile",
//     data: result,
//   });
// });

const CartController = {
  uploadCart,
  getCart,
  updateCart
};

export default CartController;
