import { Model, Schema } from "mongoose";
import { IUser } from "./user.interface";
import MongooseHelper from "../../utility/mongoose.helpers";
import Admin from "../admin/admin.model";
import { SubStatus } from "../subscription/subscription.interface";
import { SubscriptionSupportSchema } from "../subscription/subscription.model";


export const UserSchema: Schema = new Schema<IUser>(
  {
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

  },
  { timestamps: true, collection: "users" }
)

// Attach Mongoose Helpers
MongooseHelper.preSaveHashPassword(UserSchema);
MongooseHelper.preSaveConjugate<IUser>(UserSchema);
MongooseHelper.comparePasswordIntoDb(UserSchema);
MongooseHelper.findExistence<IUser>(UserSchema);
MongooseHelper.applyToJSONTransform(UserSchema);

// Export Model
const User: Model<IUser> = Admin.discriminator<IUser>("User", UserSchema);
export default User;
