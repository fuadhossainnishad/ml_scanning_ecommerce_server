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
    stripe_price_id: stripePriceId
  }


  const result = await GenericService.insertResources<IProduct>(
    Product,
    req.body?.data
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
    []
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Product data",
    data: result,
  });
});

const updateProduct: RequestHandler = catchAsync(async (req, res) => {
  // if (!req.user) {
  //   throw new AppError(httpStatus.UNAUTHORIZED, "Brand is not authenticated", "");
  // }
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
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  }

  if (req.user?.role !== "Admin") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Only admin can do update Product",
      ""
    );
  }
  const { ProductId } = req.body.data;
  const result = await GenericService.deleteResources<IProduct>(
    Product,
    await idConverter(ProductId)
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

// const TrialProduct: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have trial Product",
//       ""
//     );
//   }
//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }
//   const { ProductPlan } = req.user
//   if (ProductPlan.subType !== "none" && !ProductPlan.trialUsed) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "You have already used your trial Product",
//       ""
//     );
//   }

//   ProductPlan.trial.start = new Date()
//   ProductPlan.trial.end = new Date(ProductPlan.trial.start.getTime() + 30 * 24 * 60 * 60 * 1000)

//   const result = await ProductServices.trialService<IUser & { _id: Types.ObjectId }>(req.user)
//   ProductPlan.trial.stripe_Product_id = result
//   ProductPlan.subType = SubType.TRIAL
//   ProductPlan.trial.active = true
//   ProductPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   const updateUser = await GenericService.updateResources<IUser>(User, id, req.user)

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully get trial Product",
//     data: updateUser,
//   });
// })

// const PaidProduct: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   const { ProductId } = req.body.data

//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have paid Product",
//     );
//   }

//   if (!ProductId) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "select a Product",
//     );
//   }

//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }

//   // const { ProductPlan } = req.user
//   // if (ProductPlan.subType === "paid" && ProductPlan.paid.status === "active") {
//   //   throw new AppError(
//   //     httpStatus.BAD_REQUEST,
//   //     "You have already used your paid Product",
//   //     ""
//   //   );
//   // }

//   const Product = await GenericService.findResources<IProduct>(Product, await idConverter(ProductId))

//   const paymentIntent = await StripeServices.createPaymentIntentService({
//     userId: req.user._id.toString(),
//     stripe_customer_id: req.user.stripe_customer_id,
//     ProductId: ProductId,
//     amount: Product[0].price,
//     currency: 'usd'
//   })

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CONTINUE,
//     message: "please complete your payment to activate paid Product",
//     data: paymentIntent,
//   });
// })

// const Webhook: RequestHandler = catchAsync(async (req, res) => {
//   const { _id, stripe_customer_id, ProductPlan } = req.user
//   const sig = req.headers["stripe-signature"] as string;
//   const rawbody = req.body.data

//   const { paymentIntent } = await handleStripeWebhook({
//     sig,
//     rawbody,
//   });

//   const { orderid, ProductId } = paymentIntent.metadata

//   const paymentPayload: IPayment = {
//     orderId: await idConverter(orderid),
//     userId: _id,
//     stripeCustomerId: stripe_customer_id,
//     paymentIntentId: paymentIntent.id,
//     ProductId: await idConverter(ProductId),
//     amount: paymentIntent.amount_received / 100,
//     currency: paymentIntent.currency,
//     payment_method: paymentIntent.payment_method_types[0],
//     payStatus: true,
//     isDeleted: false
//   }

//   const insertPayment = await GenericService.insertResources<IPayment>(Payment, paymentPayload)

//   ProductPlan.paid.Product_id = await idConverter(ProductId)
//   ProductPlan.paid.status = PaidStatus.ACTIVE
//   ProductPlan.paid.start = new Date()
//   ProductPlan.paid.end = new Date(ProductPlan.paid.start.getTime() + ProductPlan.paid.length * 24 * 60 * 60 * 1000)
//   ProductPlan.subType = SubType.PAID
//   ProductPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   await GenericService.updateResources<IUser>(User, _id, req.user)

//   // const updateOrderStatus = await Product.findByIdAndUpdate(
//   //   await idConverter(orderId),
//   //   { status: "accept" },
//   //   { new: true }
//   // );
//   // if (!updateOrderStatus) {
//   //   throw new AppError(
//   //     httpStatus.NOT_FOUND,
//   //     "Order status not updated to accept due to some issue"
//   //   );
//   // }

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "success fully paid your Product",
//     data: insertPayment,
//   });
// });

const ProductController = {
  createProduct,
  getProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  // TrialProduct,
  // PaidProduct,
  // Webhook
};

export default ProductController;