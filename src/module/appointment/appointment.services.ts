// import httpStatus from "http-status";
// import AppError from "../../app/error/AppError";
// import { idConverter } from "../../utility/idConverter";
// import Insurance from "./subscription.model";

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

// const SubscriptionServices = {
//   updateSubscriptionService,
// };

// export default SubscriptionServices;
