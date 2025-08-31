import { Model, Schema } from "mongoose";
import { IUser } from "./user.interface";
import MongooseHelper from "../../utility/mongoose.helpers";
import Admin from "../admin/admin.model";
import { SubStatus } from "../subscription/subscription.interface";
import { SubscriptionSupportSchema } from "../subscription/subscription.model";

// Helpers
const isRequired = function (this: IUser): boolean {
  return !!this.firstName;
};

// const isPlanRequired = function (this: IUser): boolean {
//   return !this.trial;
// };

// Schema
export const UserSchema: Schema = new Schema<IUser>(
  {
    // sub: {
    //   type: String,
    //   required: false,
    // },
    // authProviderName: {
    //   type: String,
    //   required: isRequiredForSocial,
    // },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: isRequired,
    },
    mobile: {
      type: String,
      required: isRequired,
    },
    countryCode: {
      type: String,
      required: isRequired,
    },
    uic: {
      type: String,
      default: "",
    },
    rank: {
      type: String,
      default: "",
    },
    subscriptionPlan: {
      type: SubscriptionSupportSchema.SubscriptionPlanSchema,
      required: false,
    },
    stripe_customer_id: {
      type: String,
      required: true,
      default: "",
    },
    sub_status: {
      type: String,
      enum: Object.values(SubStatus),
      default: SubStatus.INACTIVE,
      required: true,
    },
    last_login: {
      type: Date,
      default: Date.now,
    },
    failed_attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, collection: "users" }
);

// Attach Mongoose Helpers
MongooseHelper.preSaveHashPassword(UserSchema);
MongooseHelper.preSaveConjugate<IUser>(UserSchema);
MongooseHelper.comparePasswordIntoDb(UserSchema);
MongooseHelper.findExistence<IUser>(UserSchema);
MongooseHelper.applyToJSONTransform(UserSchema);

// Export Model
const User: Model<IUser> = Admin.discriminator<IUser>("User", UserSchema);
export default User;
