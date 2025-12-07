import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
import NotificationServices from "../notification/notification.service";
import StripeServices from "../stripe/stripe.service";
import { IProduct } from "./product.interface";
import Product from "./product.model";
import StatsServices from "../stats/stats.services";

const createProduct: RequestHandler = catchAsync(async (req, res) => {
  if (req.user?.role !== "Brand") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Brand ID is required",
      ""
    );
  }

  console.log("products:", req.user, req.body!);


  const { productName, shortDescription, price } = req.body.data
  if (!productName || !shortDescription || !price) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Name, Description, price are required",
      ""
    );
  }

  const stripeProductId = await StripeServices.createStripeProductId(productName, shortDescription)
  const stripePriceId = await StripeServices.createStripePriceId({ ...req.body.data, stripeProductId })

  req.body.data = {
    ...req.body.data,
    brandId: req.user._id!,
    stripe_product_id: stripeProductId,
    stripe_price_id: stripePriceId,
  }

  console.log("products:", req.user, req.body!);
  console.log("measurement:", req.body.data.measurement!);



  const result = await GenericService.insertResources<IProduct>(
    Product,
    req.body?.data
  );
  console.log("input products:", result)

  const storeEmbedd = await StatsServices.embeddingServices({ file: req.body.data.productImages, product_id: result.product._id.toString(), category: result.product.category })
  console.log("storeEmbedd:", storeEmbedd)

  if (!storeEmbedd) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "There is problem in storing embedding",
      ""
    );
  }

  await NotificationServices.sendNoification({
    ownerId: req.user?._id,
    key: "notification",
    data: {
      id: result.Subsciption?._id.toString(),
      message: `New subsciption added`,
    },
    receiverId: [req.user?._id],
  });



  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully added new Product",
    data: result,
  });
});

const getProduct: RequestHandler = catchAsync(async (req, res) => {
  const { ProductId } = req.body.data;
  console.log("ProductId: ", ProductId);

  if (!ProductId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Product ID is required",
      ""
    );
  }
  const result = await GenericService.findResources<IProduct>(
    Product,
    await idConverter(ProductId)
  );

  console.log("getProduct:", result)
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve all Product data",
    data: result,
  });
});

const getAllProduct: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<IProduct>(
    Product,
    req.query,
    ["category", "productName", "shortDescription"]
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Product data",
    data: result,
  });
});

const updateProduct: RequestHandler = catchAsync(async (req, res) => {
  if (req.user.role !== "Brand") {
    throw new AppError(httpStatus.UNAUTHORIZED, "Brand is not authenticated", "");
  }
  const id = req?.params.id;

  // const id =
  //   typeof rawId === "string"
  //     ? rawId
  //     : Array.isArray(rawId) && typeof rawId[0] === "string"
  //       ? rawId[0]
  //       : undefined;

  const result = await GenericService.updateResources<IProduct>(
    Product,
    await idConverter(id),
    req.body.data
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Product?._id.toString(),
  //     message: `An Product updated`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated Product ",
    data: result,
  });
});

const deleteProduct: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Brand not authenticated", "");
  }

  if (req.user?.role !== "Brand") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Only admin can do update Product",
      ""
    );
  }
  const { id } = req.params
  const result = await GenericService.deleteResources<IProduct, "brandId">(
    Product,
    await idConverter(id),
    req.user._id,
    'brandId'
  );

  await NotificationServices.sendNoification({
    ownerId: req.user?._id,
    key: "notification",
    data: {
      message: `An Product deleted`,
    },
    receiverId: [req.user?._id],
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully deleted Product",
    data: result,
  });
});



const ProductController = {
  createProduct,
  getProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
};

export default ProductController;