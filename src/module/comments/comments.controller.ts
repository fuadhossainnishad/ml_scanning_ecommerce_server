import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
import NotificationServices from "../notification/notification.service";
import { IComments } from "./comments.interface";
import Comments from "./comments.model";

const createComments: RequestHandler = catchAsync(async (req, res) => {
  req.body.data.postId = await idConverter(req?.params.id);
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Commentor Id is required",
      ""
    );
  }
  const { _id, role } = req.user

  req.body.data.commentorId = _id
  req.body.data.role = role

  console.log("Comments:", req.body.data);


  const result = await GenericService.insertResources<IComments>(
    Comments,
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
    message: "successfully added new Comments",
    data: result,
  });
});

const getComments: RequestHandler = catchAsync(async (req, res) => {
  const { CommentsId } = req.body.data;
  console.log("CommentsId: ", CommentsId);

  if (!CommentsId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Comments ID is required",
      ""
    );
  }
  const result = await GenericService.findResources<IComments>(
    Comments,
    await idConverter(CommentsId)
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve all Comments data",
    data: result,
  });
});

const getAllComments: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<IComments>(
    Comments,
    req.query,
    []
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Comments data",
    data: result,
  });
});

const updateComments: RequestHandler = catchAsync(async (req, res) => {
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

  const result = await GenericService.updateResources<IComments>(
    Comments,
    await idConverter(id),
    req.body.data
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Comments?._id.toString(),
  //     message: `An Comments updated`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated Comments ",
    data: result,
  });
});

const deleteComments: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  }

  if (req.user?.role !== "Admin") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Only admin can do update Comments",
      ""
    );
  }
  const { CommentsId } = req.body.data;
  const result = await GenericService.deleteResources<IComments>(
    Comments,
    await idConverter(CommentsId)
  );

  await NotificationServices.sendNoification({
    ownerId: req.user?._id,
    key: "notification",
    data: {
      message: `An Comments deleted`,
    },
    receiverId: [req.user?._id],
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully deleted Comments",
    data: result,
  });
});

const CommentsController = {
  createComments,
  getComments,
  getAllComments,
  updateComments,
  deleteComments,
  // TrialComments,
  // PaidComments,
  // Webhook
};

export default CommentsController;

// const TrialComments: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have trial Comments",
//       ""
//     );
//   }
//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }
//   const { CommentsPlan } = req.user
//   if (CommentsPlan.subType !== "none" && !CommentsPlan.trialUsed) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "You have already used your trial Comments",
//       ""
//     );
//   }

//   CommentsPlan.trial.start = new Date()
//   CommentsPlan.trial.end = new Date(CommentsPlan.trial.start.getTime() + 30 * 24 * 60 * 60 * 1000)

//   const result = await CommentsServices.trialService<IUser & { _id: Types.ObjectId }>(req.user)
//   CommentsPlan.trial.stripe_Comments_id = result
//   CommentsPlan.subType = SubType.TRIAL
//   CommentsPlan.trial.active = true
//   CommentsPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   const updateUser = await GenericService.updateResources<IUser>(User, id, req.user)

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully get trial Comments",
//     data: updateUser,
//   });
// })

// const PaidComments: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   const { CommentsId } = req.body.data

//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have paid Comments",
//     );
//   }

//   if (!CommentsId) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "select a Comments",
//     );
//   }

//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }

//   // const { CommentsPlan } = req.user
//   // if (CommentsPlan.subType === "paid" && CommentsPlan.paid.status === "active") {
//   //   throw new AppError(
//   //     httpStatus.BAD_REQUEST,
//   //     "You have already used your paid Comments",
//   //     ""
//   //   );
//   // }

//   const Comments = await GenericService.findResources<IComments>(Comments, await idConverter(CommentsId))

//   const paymentIntent = await StripeServices.createPaymentIntentService({
//     userId: req.user._id.toString(),
//     stripe_customer_id: req.user.stripe_customer_id,
//     CommentsId: CommentsId,
//     amount: Comments[0].price,
//     currency: 'usd'
//   })

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CONTINUE,
//     message: "please complete your payment to activate paid Comments",
//     data: paymentIntent,
//   });
// })

// const Webhook: RequestHandler = catchAsync(async (req, res) => {
//   const { _id, stripe_customer_id, CommentsPlan } = req.user
//   const sig = req.headers["stripe-signature"] as string;
//   const rawbody = req.body.data

//   const { paymentIntent } = await handleStripeWebhook({
//     sig,
//     rawbody,
//   });

//   const { orderid, CommentsId } = paymentIntent.metadata

//   const paymentPayload: IPayment = {
//     orderId: await idConverter(orderid),
//     userId: _id,
//     stripeCustomerId: stripe_customer_id,
//     paymentIntentId: paymentIntent.id,
//     CommentsId: await idConverter(CommentsId),
//     amount: paymentIntent.amount_received / 100,
//     currency: paymentIntent.currency,
//     payment_method: paymentIntent.payment_method_types[0],
//     payStatus: true,
//     isDeleted: false
//   }

//   const insertPayment = await GenericService.insertResources<IPayment>(Payment, paymentPayload)

//   CommentsPlan.paid.Comments_id = await idConverter(CommentsId)
//   CommentsPlan.paid.status = PaidStatus.ACTIVE
//   CommentsPlan.paid.start = new Date()
//   CommentsPlan.paid.end = new Date(CommentsPlan.paid.start.getTime() + CommentsPlan.paid.length * 24 * 60 * 60 * 1000)
//   CommentsPlan.subType = SubType.PAID
//   CommentsPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   await GenericService.updateResources<IUser>(User, _id, req.user)

//   // const updateOrderStatus = await Comments.findByIdAndUpdate(
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
//     message: "success fully paid your Comments",
//     data: insertPayment,
//   });
// });

