import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import sendResponse from "../../utility/sendResponse";
import GenericService from "../../utility/genericService.helpers";
import { idConverter } from "../../utility/idConverter";
import NotificationServices from "../notification/notification.service";
import Admin from "../admin/admin.model";
import { IFollow } from "./follow.interface";
import Follow from "./follow.model";

const createFollow: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Authenticated user is required",
      ""
    );
  }
  const { _id, role } = req.user;
  const { id } = req.params;

  if (_id.toString() === id.toString()) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot follow yourself",
      ""
    );
  }

  const findUser = await Admin.findOne({ _id: await idConverter(id) }, { role: 1 });

  if (!findUser) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User to follow not found",
      ""
    );
  }

  const data: IFollow = {
    authorId: _id,
    authorType: role,
    following: [
      {
        id: await idConverter(id),
        type: findUser.role!,
      }
    ],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await GenericService.insertResources<IFollow>(
    Follow,
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
    message: "successfully add to Follow",
    data: result,
  });
});

const getFollow: RequestHandler = catchAsync(async (req, res) => {
  const { FollowId } = req.body.data;
  console.log("FollowId: ", FollowId);

  if (!FollowId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Follow ID is required",
      ""
    );
  }
  const result = await GenericService.findResources<IFollow>(
    Follow,
    await idConverter(FollowId)
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve all Follow data",
    data: result,
  });
});

const getAllFollow: RequestHandler = catchAsync(async (req, res) => {
  const result = await GenericService.findAllResources<IFollow>(
    Follow,
    req.query,
    []
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully retrieve Follow data",
    data: result,
  });
});

const updateFollow: RequestHandler = catchAsync(async (req, res) => {
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

  const result = await GenericService.updateResources<IFollow>(
    Follow,
    await idConverter(id),
    req.body.data
  );

  // await NotificationServices.sendNoification({
  //   ownerId: req.user?._id,
  //   key: "notification",
  //   data: {
  //     id: result.Follow?._id.toString(),
  //     message: `An Follow updated`,
  //   },
  //   receiverId: [req.user?._id],
  // });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully updated Follow ",
    data: result,
  });
});

const deleteFollow: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
  }

  if (req.user?.role !== "Admin") {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Only admin can do update Follow",
      ""
    );
  }
  const { FollowId } = req.body.data;
  const result = await GenericService.deleteResources<IFollow>(
    Follow,
    await idConverter(FollowId)
  );

  await NotificationServices.sendNoification({
    ownerId: req.user?._id,
    key: "notification",
    data: {
      message: `An Follow deleted`,
    },
    receiverId: [req.user?._id],
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "successfully deleted Follow",
    data: result,
  });
});

// const TrialFollow: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have trial Follow",
//       ""
//     );
//   }
//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }
//   const { FollowPlan } = req.user
//   if (FollowPlan.subType !== "none" && !FollowPlan.trialUsed) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "You have already used your trial Follow",
//       ""
//     );
//   }

//   FollowPlan.trial.start = new Date()
//   FollowPlan.trial.end = new Date(FollowPlan.trial.start.getTime() + 30 * 24 * 60 * 60 * 1000)

//   const result = await FollowServices.trialService<IUser & { _id: Types.ObjectId }>(req.user)
//   FollowPlan.trial.stripe_Follow_id = result
//   FollowPlan.subType = SubType.TRIAL
//   FollowPlan.trial.active = true
//   FollowPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   const updateUser = await GenericService.updateResources<IUser>(User, id, req.user)

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully get trial Follow",
//     data: updateUser,
//   });
// })

// const PaidFollow: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   const { FollowId } = req.body.data

//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have paid Follow",
//     );
//   }

//   if (!FollowId) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "select a Follow",
//     );
//   }

//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }

//   // const { FollowPlan } = req.user
//   // if (FollowPlan.subType === "paid" && FollowPlan.paid.status === "active") {
//   //   throw new AppError(
//   //     httpStatus.BAD_REQUEST,
//   //     "You have already used your paid Follow",
//   //     ""
//   //   );
//   // }

//   const Follow = await GenericService.findResources<IFollow>(Follow, await idConverter(FollowId))

//   const paymentIntent = await StripeServices.createPaymentIntentService({
//     userId: req.user._id.toString(),
//     stripe_customer_id: req.user.stripe_customer_id,
//     FollowId: FollowId,
//     amount: Follow[0].price,
//     currency: 'usd'
//   })

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CONTINUE,
//     message: "please complete your payment to activate paid Follow",
//     data: paymentIntent,
//   });
// })

// const Webhook: RequestHandler = catchAsync(async (req, res) => {
//   const { _id, stripe_customer_id, FollowPlan } = req.user
//   const sig = req.headers["stripe-signature"] as string;
//   const rawbody = req.body.data

//   const { paymentIntent } = await handleStripeWebhook({
//     sig,
//     rawbody,
//   });

//   const { orderid, FollowId } = paymentIntent.metadata

//   const paymentPayload: IPayment = {
//     orderId: await idConverter(orderid),
//     userId: _id,
//     stripeCustomerId: stripe_customer_id,
//     paymentIntentId: paymentIntent.id,
//     FollowId: await idConverter(FollowId),
//     amount: paymentIntent.amount_received / 100,
//     currency: paymentIntent.currency,
//     payment_method: paymentIntent.payment_method_types[0],
//     payStatus: true,
//     isDeleted: false
//   }

//   const insertPayment = await GenericService.insertResources<IPayment>(Payment, paymentPayload)

//   FollowPlan.paid.Follow_id = await idConverter(FollowId)
//   FollowPlan.paid.status = PaidStatus.ACTIVE
//   FollowPlan.paid.start = new Date()
//   FollowPlan.paid.end = new Date(FollowPlan.paid.start.getTime() + FollowPlan.paid.length * 24 * 60 * 60 * 1000)
//   FollowPlan.subType = SubType.PAID
//   FollowPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   await GenericService.updateResources<IUser>(User, _id, req.user)

//   // const updateOrderStatus = await Follow.findByIdAndUpdate(
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
//     message: "success fully paid your Follow",
//     data: insertPayment,
//   });
// });

const FollowController = {
  createFollow,
  getFollow,
  getAllFollow,
  updateFollow,
  deleteFollow,
  // TrialFollow,
  // PaidFollow,
  // Webhook
};

export default FollowController;