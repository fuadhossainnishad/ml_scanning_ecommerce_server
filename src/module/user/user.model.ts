import { Model, Schema } from "mongoose";
import { IUser } from "./user.interface";
import MongooseHelper from "../../utility/mongoose.helpers";
import Admin from "../admin/admin.model";


export const UserSchema: Schema = new Schema<IUser>(
  {
    hometown: {
      type: String,
      default: '',
    },
    about: {
      type: String,
      default: '',
    },
    favouriteStyles: [{
      type: String,
      default: '',
    }],
    theme: {
      type: String,
      default: '',
    },
  },
  { timestamps: true, collection: "users" }
)

// Attach Mongoose Helpers
MongooseHelper.preSaveConjugate<IUser>(UserSchema);
MongooseHelper.findExistence<IUser>(UserSchema);
MongooseHelper.applyToJSONTransform(UserSchema);

// Export Model
const User: Model<IUser> = Admin.discriminator<IUser>("User", UserSchema);
export default User;
