// import httpStatus from 'http-status';
// import httpStatus from "http-status";
// import AppError from "../../app/error/AppError";
// import { idConverter } from "../../utility/idConverter";
// import Insurance from "./subscription.model";

// import AppError from "../../app/error/AppError";
// import { IUser } from "../user/user.interface";
// import StripeServices from '../stripe/stripe.service';
// import { Types } from 'mongoose';

// const updateSubscriptionService = async (payload: TInsuranceUpdate) => {
//   const { insuranceId, ...updateData } = payload;
//   const insuranceIdObject = await idConverter(insuranceId);

//   if (!insuranceIdObject) {
//     throw new AppError(httpStatus.NOT_FOUND, "Insurance id is required");
//   }
//   const foundInsurance = await Insurance.findById(insuranceIdObject);
//   if (!foundInsurance) {
//     throw new AppError(httpStatus.NOT_FOUND, "No insurance has found");
//   }

//   Object.assign(foundInsurance, updateData);
//   foundInsurance.save();
//   return { insurance: foundInsurance };
// };



// const trialService = async <T extends IUser & { _id: Types.ObjectId }>(payload: T) => {
//     const { subscriptionPlan } = payload;
//     if (subscriptionPlan.trialUsed === true) {
//         throw new AppError(httpStatus.EXPECTATION_FAILED, "Trial have used try paid one")
//     }
//     const { _id, stripe_customer_id } = payload
//     const freeTrial_id = await StripeServices.createSubscription({ _id, stripe_customer_id, trialEnd: subscriptionPlan.trial.end })
//     if (!freeTrial_id) {
//         throw new AppError(httpStatus.BAD_REQUEST, "Something error happened, try again later")
//     }
//     return freeTrial_id
// }

// const SubscriptionServices = {
//     trialService
// };

// export default SubscriptionServices