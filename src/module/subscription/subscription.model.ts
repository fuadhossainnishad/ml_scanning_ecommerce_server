// import { Subscription } from './../appointment/appointment.interface';
// import { model, Model, Schema } from "mongoose";
// import { IBase, IPaid, ISubscription, ISubscriptionPlan, ITrial, PaidStatus, SubType, IntervalType } from './subscription.interface';
// import MongooseHelper from "../../utility/mongoose.helpers";



// const BaseSchemaOptions = new Schema<IBase>(
//   {
//     stripe_subscription_id: {
//       type: String,
//       required: true,
//     },
//     length: {
//       type: Number,
//       default: 30,
//     },
//     start: {
//       type: Date,
//       required: true,
//     },
//     end: {
//       type: Date,
//       required: true,
//     },
//   },
//   { _id: false }
// );

// const TrialSchema = new Schema<ITrial>(
//   {
//     active: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { _id: false }
// ).add(BaseSchemaOptions)

// const PaidSchema = new Schema<IPaid>(
//   {

//     status: {
//       type: String,
//       enum: Object.values(PaidStatus),
//       required: true,
//     },
//     subscription_id: {
//       type: Schema.Types.ObjectId,
//       ref: "Subscription",
//       required: true,
//     },

//   },
//   { _id: false }
// ).add(BaseSchemaOptions)

// const SubscriptionPlanSchema: Schema = new Schema<ISubscriptionPlan>(
//   {
//     trial: {
//       type: TrialSchema,
//       required: true,
//     },
//     trialUsed: {
//       type: Boolean,
//       default: false,
//     },
//     paid: {
//       type: PaidSchema,
//       required: function (this): boolean {
//         return !this.trial.active && !this.trialUsed;
//       },
//     },
//     subType: {
//       type: String,
//       enum: Object.values(SubType),
//       default: "none",
//       required: true,
//     },
//     isActive: {
//       type: Boolean,
//       default: function (this): boolean {
//         return this.trial.active || this.paid.status === PaidStatus.ACTIVE;
//       },
//       required: true,
//     },
//   },
//   { _id: false }
// )

// const SubscriptionSchema: Schema = new Schema<ISubscription>(
//   {
//     subscriptionName: {
//       type: String,
//       required: true,
//     },
//     shortDescription: [
//       {
//         type: String,
//         required: true,
//       },
//     ],
//     price: {
//       type: Number,
//       required: true,
//     },
//     interval: {
//       type: String,
//       enum: Object.values(IntervalType),
//       required: true,
//     },
//     stripeProductId: {
//       type: String,
//       required: true,
//     },
//     stripePriceId: {
//       type: String,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// MongooseHelper.findExistence<ISubscription>(SubscriptionSchema);
// MongooseHelper.applyToJSONTransform(SubscriptionSchema);

// const Subscription: Model<ISubscription> = model<ISubscription>(
//   "Subscription",
//   SubscriptionSchema
// );
// export default Subscription;

// export const SubscriptionSupportSchema = {
//   SubscriptionPlanSchema,
//   TrialSchema,
//   PaidSchema
// }
