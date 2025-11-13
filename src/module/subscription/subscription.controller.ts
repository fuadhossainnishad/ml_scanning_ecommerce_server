// import httpStatus from "http-status";
// import { RequestHandler } from "express";
// import catchAsync from "../../utility/catchAsync";
// import AppError from "../../app/error/AppError";
// import sendResponse from "../../utility/sendResponse";
// import GenericService from "../../utility/genericService.helpers";
// import { idConverter } from "../../utility/idConverter";
// import NotificationServices from "../notification/notification.service";
// import { ISubscription, PaidStatus, SubStatus, SubType } from "./subscription.interface";
// import User from "../user/user.model";
// import StripeUtils from "../../utility/stripe.utils";
// import { IUser } from "../user/user.interface";
// import SubscriptionServices from "./subscription.services";
// import StripeServices, { handleStripeWebhook } from "../stripe/stripe.service";
// import { Types } from "mongoose";
// import Subscription from "./subscription.model";
// import Payment from "../payment/payment.model";
// import { IPayment } from "../payment/payment.interface";

// const createSubscription: RequestHandler = catchAsync(async (req, res) => {
//   // if (req.user?.role !== "Admin") {
//   //   throw new AppError(
//   //     httpStatus.BAD_REQUEST,
//   //     "Author ID is required",
//   //     ""
//   //   );
//   // }
//   const { name, description, price, interval } = req.body.data;
//   if (!name || !description || price || interval) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Name, Description, price & interval are required",
//       ""
//     );
//   }
//   const stripeProductId = await StripeServices.createStripeProductId(name, description)
//   const stripePriceId = await StripeServices.createStripePriceId({ ...req.body.data, stripeProductId })

//   req.body.data = { ...req.body.data, stripePriceId }

//   const result = await GenericService.insertResources<ISubscription>(
//     Subscription,
//     req.body?.data
//   );

//   // await NotificationServices.sendNoification({
//   //   ownerId: req.user?._id,
//   //   key: "notification",
//   //   data: {
//   //     id: result.Subsciption?._id.toString(),
//   //     message: `New subsciption added`,
//   //   },
//   //   receiverId: [req.user?._id],
//   // });



//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully added new subscription",
//     data: result,
//   });
// });

// const getSubscription: RequestHandler = catchAsync(async (req, res) => {
//   const { subscriptionId } = req.body.data;
//   console.log("SubscriptionId: ", subscriptionId);

//   if (!subscriptionId) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Subscription ID is required",
//       ""
//     );
//   }
//   const result = await GenericService.findResources<ISubscription>(
//     Subscription,
//     await idConverter(subscriptionId)
//   );
//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully retrieve all Subscription data",
//     data: result,
//   });
// });

// const getAllSubscription: RequestHandler = catchAsync(async (req, res) => {
//   const result = await GenericService.findAllResources<ISubscription>(
//     Subscription,
//     req.query,
//     ["title", "price"]
//   );

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully retrieve Subscription data",
//     data: result,
//   });
// });

// const updateSubscription: RequestHandler = catchAsync(async (req, res) => {
//   // if (!req.user) {
//   //   throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
//   // }
//   const id = req?.params.id;

//   // const id =
//   //   typeof rawId === "string"
//   //     ? rawId
//   //     : Array.isArray(rawId) && typeof rawId[0] === "string"
//   //       ? rawId[0]
//   //       : undefined;

//   const result = await GenericService.updateResources<ISubscription>(
//     Subscription,
//     await idConverter(id),
//     req.body.data
//   );

//   // await NotificationServices.sendNoification({
//   //   ownerId: req.user?._id,
//   //   key: "notification",
//   //   data: {
//   //     id: result.subscription?._id.toString(),
//   //     message: `An Subscription updated`,
//   //   },
//   //   receiverId: [req.user?._id],
//   // });

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully updated Subscription ",
//     data: result,
//   });
// });

// const deleteSubscription: RequestHandler = catchAsync(async (req, res) => {
//   if (!req.user) {
//     throw new AppError(httpStatus.UNAUTHORIZED, "Admin not authenticated", "");
//   }

//   if (req.user?.role !== "Admin") {
//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       "Only admin can do update subscription",
//       ""
//     );
//   }
//   const { subscriptionId } = req.body.data;
//   const result = await GenericService.deleteResources<ISubscription>(
//     Subscription,
//     await idConverter(subscriptionId)
//   );

//   await NotificationServices.sendNoification({
//     ownerId: req.user?._id,
//     key: "notification",
//     data: {
//       message: `An Subscription deleted`,
//     },
//     receiverId: [req.user?._id],
//   });

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully deleted subscription",
//     data: result,
//   });
// });

// const TrialSubscription: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have trial subscription",
//       ""
//     );
//   }
//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }
//   const { subscriptionPlan } = req.user
//   if (subscriptionPlan.subType !== "none" && !subscriptionPlan.trialUsed) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "You have already used your trial subscription",
//       ""
//     );
//   }

//   subscriptionPlan.trial.start = new Date()
//   subscriptionPlan.trial.end = new Date(subscriptionPlan.trial.start.getTime() + 30 * 24 * 60 * 60 * 1000)

//   const result = await SubscriptionServices.trialService<IUser & { _id: Types.ObjectId }>(req.user)
//   subscriptionPlan.trial.stripe_subscription_id = result
//   subscriptionPlan.subType = SubType.TRIAL
//   subscriptionPlan.trial.active = true
//   subscriptionPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   const updateUser = await GenericService.updateResources<IUser>(User, id, req.user)

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "successfully get trial subscription",
//     data: updateUser,
//   });
// })

// const PaidSubscription: RequestHandler = catchAsync(async (req, res) => {
//   const { role, email, id, stripe_customer_id } = req.user;
//   const { subscriptionId } = req.body.data

//   if (role !== "User" || !email || !id) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "Only valid user can have paid subscription",
//     );
//   }

//   if (!subscriptionId) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "select a subscription",
//     );
//   }

//   if (stripe_customer_id == "") {
//     const customer_id = await StripeUtils.CreateCustomerId(email);
//     req.user = await GenericService.updateResources<IUser>(User, id, { stripe_customer_id: customer_id })
//   }

//   // const { subscriptionPlan } = req.user
//   // if (subscriptionPlan.subType === "paid" && subscriptionPlan.paid.status === "active") {
//   //   throw new AppError(
//   //     httpStatus.BAD_REQUEST,
//   //     "You have already used your paid subscription",
//   //     ""
//   //   );
//   // }

//   const subscription = await GenericService.findResources<ISubscription>(Subscription, await idConverter(subscriptionId))

//   const paymentIntent = await StripeServices.createPaymentIntentService({
//     userId: req.user._id.toString(),
//     stripe_customer_id: req.user.stripe_customer_id,
//     subscriptionId: subscriptionId,
//     amount: subscription[0].price,
//     currency: 'usd'
//   })

//   sendResponse(res, {
//     success: true,
//     statusCode: httpStatus.CONTINUE,
//     message: "please complete your payment to activate paid subscription",
//     data: paymentIntent,
//   });
// })

// const Webhook: RequestHandler = catchAsync(async (req, res) => {
//   const { _id, stripe_customer_id, subscriptionPlan } = req.user
//   const sig = req.headers["stripe-signature"] as string;
//   const rawbody = req.body.data

//   const { paymentIntent } = await handleStripeWebhook({
//     sig,
//     rawbody,
//   });

//   const { orderid, subscriptionId } = paymentIntent.metadata

//   const paymentPayload: IPayment = {
//     orderId: await idConverter(orderid),
//     userId: _id,
//     stripeCustomerId: stripe_customer_id,
//     paymentIntentId: paymentIntent.id,
//     subscriptionId: await idConverter(subscriptionId),
//     amount: paymentIntent.amount_received / 100,
//     currency: paymentIntent.currency,
//     payment_method: paymentIntent.payment_method_types[0],
//     payStatus: true,
//     isDeleted: false
//   }

//   const insertPayment = await GenericService.insertResources<IPayment>(Payment, paymentPayload)

//   subscriptionPlan.paid.subscription_id = await idConverter(subscriptionId)
//   subscriptionPlan.paid.status = PaidStatus.ACTIVE
//   subscriptionPlan.paid.start = new Date()
//   subscriptionPlan.paid.end = new Date(subscriptionPlan.paid.start.getTime() + subscriptionPlan.paid.length * 24 * 60 * 60 * 1000)
//   subscriptionPlan.subType = SubType.PAID
//   subscriptionPlan.isActive = true
//   req.user.sub_status = SubStatus.ACTIVE

//   await GenericService.updateResources<IUser>(User, _id, req.user)

//   // const updateOrderStatus = await Subscription.findByIdAndUpdate(
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
//     message: "success fully paid your subscription",
//     data: insertPayment,
//   });
// });

// const SubscriptionController = {
//   createSubscription,
//   getSubscription,
//   getAllSubscription,
//   updateSubscription,
//   deleteSubscription,
//   TrialSubscription,
//   PaidSubscription,
//   Webhook
// };

// export default SubscriptionController;