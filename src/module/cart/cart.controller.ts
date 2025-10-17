import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import Cart from './cart.model';
import { ICart, ICartResponse } from "./cart.interface";
import { idConverter } from "../../utility/idConverter";
import QueryBuilder from "../../app/builder/QueryBuilder";

const uploadCart: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Authenticated user is required", "");
  }

  const { productId, color, size, quantity } = req.body.data
  if (!productId || !color || !size || quantity == null || Number(quantity) <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid cart data: productId, color, size, and positive quantity are required", "");
  }

  const convertedProductId = await idConverter(productId);
  const numQuantity = Number(quantity);

  console.log("Cart data:", { productId: convertedProductId, color, size, quantity: numQuantity });

  const findProductInCart = await Cart.find({
    userId: req.user._id,
    "products.productId": convertedProductId,
    "products.color": color,
    "products.size": size,
    "products.isDeleted": false,
    isDeleted: false
  });

  let result;

  if (findProductInCart.length > 0) {
    const existingCart: ICartResponse = findProductInCart[0];
    const matchingProduct = existingCart.products.find(p =>
      p.productId.toString() === convertedProductId.toString() &&
      p.color === color &&
      p.size === size &&
      p.isDeleted === false
    );

    const productData = {
      ...req.body.data,
      productId: convertedProductId,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (matchingProduct) {
      const newQuantity = Number(matchingProduct.quantity) + numQuantity;

      await Cart.updateOne(
        { _id: existingCart._id, "products._id": matchingProduct._id },
        {
          $set: { "products.$.quantity": newQuantity, updatedAt: new Date() }
        }
      );
    } else {
      await Cart.updateOne(
        { _id: existingCart._id },
        {
          $push: { products: productData },
          $set: { updatedAt: new Date() }
        }
      );
    }

    // Fetch updated cart data
    const baseQuery = Cart.find({ userId: req.user._id, 'products.productId': convertedProductId, isDeleted: false });
    const queryBuilder = new QueryBuilder(baseQuery, {})
      .search([])
      .filter()
      .sort()
      .pagination()
      .fields();
    const resources = await queryBuilder.modelQuery;
    const meta = await queryBuilder.countTotal();

    result = { meta, cart: resources };


  } else {
    const cartData = {
      userId: req.user._id,
      products: [{
        ...req.body.data,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    result = await GenericService.insertResources<ICart>(Cart, cartData);
  }


  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Successfully added to cart",
    data: result
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
