import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import Cart from "./cart.model";
import { ICart } from "./cart.interface";
import { idConverter } from "../../utility/idConverter";
import QueryBuilder from "../../app/builder/QueryBuilder";
import CartServices from "./cart.services";
import Product from "../product/product.model";

const uploadCart: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated user is required",
      ""
    );
  }

  const { productId, color, size, quantity } = req.body.data;
  console.log("Received cart data:", req.body.data);

  if (
    !productId ||
    !color ||
    !size ||
    quantity == null ||
    Number(quantity) <= 0
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid cart data: productId, color, size, and positive quantity are required",
      ""
    );
  }

  // await Product.updateMany(
  //   { isDeleted: { $exists: false } },
  //   { $set: { isDeleted: false } }
  // )

  const convertedProductId = await idConverter(productId);
  console.log("convertedProductId:", convertedProductId)
  const real = await Product.findOne({ _id: convertedProductId }, null, { lean: true }).sort({ createdAt: -1 });
  console.log("REAL PRODUCT FROM DB:", real);
  const isExistProduct = await Product.findOne({
    _id: convertedProductId,
    isDeleted: false,
    inStock: true,
    totalQuantity: { $gte: quantity }
  })

  console.log("isExistProduct:", isExistProduct)
  if (!isExistProduct) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid product, please select a valid product",
      ""
    );
  }
  const numQuantity = Number(quantity);

  console.log("Cart data:", {
    productId: convertedProductId,
    color,
    size,
    quantity: numQuantity,
  });

  const productData = {
    productId: convertedProductId,
    color,
    size,
    quantity: numQuantity,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let result;

  const existentCarts = await Cart.find({
    userId: req.user._id,
    isDeleted: false,
  }).sort({ updatedAt: -1 });

  if (existentCarts.length === 0) {

    const cartData = {
      userId: req.user._id,
      products: [productData],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    result = await GenericService.insertResources<ICart>(Cart, cartData);
  } else {
    const targetCart = existentCarts[0];

    const matchingProduct = targetCart.products.find(
      (p) =>
        p.productId.toString() === convertedProductId.toString() &&
        p.color === color &&
        p.size === size &&
        p.isDeleted === false
    );

    if (matchingProduct) {
      const newQuantity = Number(matchingProduct.quantity) + numQuantity;
      await Cart.updateOne(
        { _id: targetCart._id, "products._id": matchingProduct._id },
        {
          $set: { "products.$.quantity": newQuantity, updatedAt: new Date() },
        }
      );
    } else {
      await Cart.updateOne(
        { _id: targetCart._id },
        {
          $push: { products: productData },
          $set: { updatedAt: new Date() },
        }
      );
    }

    const baseQuery = Cart.find({ userId: req.user._id, isDeleted: false });
    const queryBuilder = new QueryBuilder(baseQuery, req.query)
      .search([])
      .filter()
      .sort()
      .pagination()
      .fields();
    const resources = await queryBuilder.modelQuery;
    const meta = await queryBuilder.countTotal();

    result = { meta, cart: resources[0] || null };
  }


  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Successfully added to cart",
    data: result,
  });
});

const getCart: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated user is required",
      ""
    );
  }
  const existCart = await Cart.find({ userId: req.user._id })
  console.log("existCart details:", existCart);
  const result = await CartServices.getCartService(req);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Cart data",
    data: result,
  });
});

const updateCart: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated user is required",
      ""
    );
  }

  const updatedCart = { userId: req.user._id, products: req.body.data };

  console.log("updated cart:", updatedCart);


  const result = await GenericService.updateResources<ICart>(
    Cart,
    await idConverter(id),
    updatedCart
  );

  console.log("update cart:", result)

  const existCart = await Cart.find({ userId: req.user._id })
  console.log("existCart details:", existCart);
  const finalresult = await CartServices.getCartService(req);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully update cart data",
    data: { cart: finalresult },
  });
});

const deleteFromCart: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated user is required",
      ""
    );
  }

  const result = await CartServices.deleteFromCartService(req);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully update cart data",
    data: result
  });
})

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
  updateCart,
  deleteFromCart
};

export default CartController;
