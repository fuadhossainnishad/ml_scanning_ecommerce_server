import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
import NotificationServices from "../notification/notification.service";
import { IPost } from "../post/post.interface";
import Post from "../post/post.model";
import { IFavouritePost, IFavouriteProduct } from "./favourite.interface";
import FavouritePost from "./favourite.post.model";
import FavouriteProduct from "./favourite.product.model";

const createFavouritePost: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated owner is required",
      ""
    );
  }

  // if (req.user?.role !== "Brand" && req.user.role !== "User") {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     "User/Brand is required",
  //     ""
  //   );
  // }

  const { _id, role } = req.user

  const data: IFavouritePost = {
    ownerId: _id,
    ownerType: role,
    postId: [await idConverter(req.params.id)],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await GenericService.insertResources<IFavouritePost>(
    FavouritePost,
    data
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
    message: "successfully added post as favourite",
    data: result,
  });
});

const createFavouriteProduct: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated owner is required",
      ""
    );
  }

  // if (req.user?.role !== "Brand" && req.user.role !== "User") {
  //   throw new AppError(
  //     httpStatus.BAD_REQUEST,
  //     "User/Brand is required",
  //     ""
  //   );
  // }

  const { _id, role } = req.user
  const data: IFavouriteProduct = {
    ownerId: _id,
    ownerType: role,
    productId: [await idConverter(req.params.id)],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const result = await GenericService.insertResources<IFavouriteProduct>(
    FavouriteProduct,
    data
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
    message: "successfully added product as favourite",
    data: result,
  });
});

const getFavourite: RequestHandler = catchAsync(async (req, res) => {
  const { PostId } = req.body.data;
  console.log("PostId: ", PostId);

  if (!PostId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Post ID is required",
      ""
    );
  }
  const result = await GenericService.findResources<IPost>(
    Post,
    await idConverter(PostId)
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve all Post data",
    data: result,
  });
});

const getAllFavouritePost: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User/Brand is required",
      ""
    );
  }
  const query = {
    ...req?.query,
    ownerId: req.user?._id.toString()
  }

  const result = await GenericService.findAllResources<IFavouritePost>(
    FavouritePost,
    query,
    []
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve favourite post data",
    data: result,
  });
});
const getAllFavouriteProduct: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User/Brand is required",
      ""
    );
  }
  const query = {
    ...req?.query,
    ownerId: req.user?._id.toString()
  }

  const result = await GenericService.findAllResources<IFavouriteProduct>(
    FavouriteProduct,
    query,
    []
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve favourite product data",
    data: result,
  });
});

const updateFavourite: RequestHandler = catchAsync(async (req, res) => {
  // if (!req.user) {
  //   throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  // }
  const id = req?.params.id;

  // const id =
  //   typeof rawId === "string"
  //     ? rawId
  //     : Array.isArray(rawId) && typeof rawId[0] === "string"
  //       ? rawId[0]
  //       : undefined;

  const result = await GenericService.updateResources<IPost>(
    Post,
    await idConverter(id),
    req.body.data
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Post?._id.toString(),
  //     message: `An Post updated`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated Post ",
    data: result,
  });
});

const deleteFavourite: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  }

  if (req.user?.role !== "Admin") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Only admin can do update Post",
      ""
    );
  }
  const { PostId } = req.body.data;
  const result = await GenericService.deleteResources<IPost>(
    Post,
    await idConverter(PostId)
  );

  await NotificationServices.sendNoification({
    ownerId: req.user?._id,
    key: "notification",
    data: {
      message: `An Post deleted`,
    },
    receiverId: [req.user?._id],
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully deleted Post",
    data: result,
  });
});

// const TrialPost: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have trial Post",
//       ""
//     );
//   }
//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }
//   const { PostPlan } = req.user
//   if (PostPlan.subType !== "none" && !PostPlan.trialUsed) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "You have already used your trial Post",
//       ""
//     );
//   }

//   PostPlan.trial.start = new Date()
//   PostPlan.trial.end = new Date(PostPlan.trial.start.getTime() + 30 * 24 * 60 * 60 * 1000)

//   const result = await PostServices.trialService<IUser & { _id: Types.ObjectId }>(req.user)
//   PostPlan.trial.stripe_Post_id = result
//   PostPlan.subType = SubType.TRIAL
//   PostPlan.trial.active = true
//   PostPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   const updateUser = await GenericService.updateResources<IUser>(User, id, req.user)

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully get trial Post",
//     data: updateUser,
//   });
// })

// const PaidPost: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   const { PostId } = req.body.data

//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have paid Post",
//     );
//   }

//   if (!PostId) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "select a Post",
//     );
//   }

//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }

//   // const { PostPlan } = req.user
//   // if (PostPlan.subType === "paid" && PostPlan.paid.status === "active") {
//   //   throw new AppError(
//   //     httpStatus.BAD_REQUEST,
//   //     "You have already used your paid Post",
//   //     ""
//   //   );
//   // }

//   const Post = await GenericService.findResources<IPost>(Post, await idConverter(PostId))

//   const paymentIntent = await StripeServices.createPaymentIntentService({
//     userId: req.user._id.toString(),
//     stripe_customer_id: req.user.stripe_customer_id,
//     PostId: PostId,
//     amount: Post[0].price,
//     currency: 'usd'
//   })

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CONTINUE,
//     message: "please complete your payment to activate paid Post",
//     data: paymentIntent,
//   });
// })

// const Webhook: RequestHandler = catchAsync(async (req, res) => {
//   const { _id, stripe_customer_id, PostPlan } = req.user
//   const sig = req.headers["stripe-signature"] as string;
//   const rawbody = req.body.data

//   const { paymentIntent } = await handleStripeWebhook({
//     sig,
//     rawbody,
//   });

//   const { orderid, PostId } = paymentIntent.metadata

//   const paymentPayload: IPayment = {
//     orderId: await idConverter(orderid),
//     userId: _id,
//     stripeCustomerId: stripe_customer_id,
//     paymentIntentId: paymentIntent.id,
//     PostId: await idConverter(PostId),
//     amount: paymentIntent.amount_received / 100,
//     currency: paymentIntent.currency,
//     payment_method: paymentIntent.payment_method_types[0],
//     payStatus: true,
//     isDeleted: false
//   }

//   const insertPayment = await GenericService.insertResources<IPayment>(Payment, paymentPayload)

//   PostPlan.paid.Post_id = await idConverter(PostId)
//   PostPlan.paid.status = PaidStatus.ACTIVE
//   PostPlan.paid.start = new Date()
//   PostPlan.paid.end = new Date(PostPlan.paid.start.getTime() + PostPlan.paid.length * 24 * 60 * 60 * 1000)
//   PostPlan.subType = SubType.PAID
//   PostPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   await GenericService.updateResources<IUser>(User, _id, req.user)

//   // const updateOrderStatus = await Post.findByIdAndUpdate(
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
//     message: "success fully paid your Post",
//     data: insertPayment,
//   });
// });

const FavouriteController = {
  createFavouritePost,
  createFavouriteProduct,
  getFavourite,
  getAllFavouritePost,
  getAllFavouriteProduct,
  updateFavourite,
  deleteFavourite,
  // TrialPost,
  // PaidPost,
  // Webhook
};

export default FavouriteController;