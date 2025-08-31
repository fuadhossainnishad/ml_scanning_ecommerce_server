import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IAdmin } from "./admin.interface";
import { Role } from "../auth/auth.interface";

const isRequired = function (this: IAdmin): boolean {
  return !(this.role === "Admin");
};
const AdminSchema: Schema = new Schema<IAdmin>(
  {
    // sub: {
    //   type: String,
    //   required: false,
    // },
    // authProviderName: {
    //   type: String,
    //   required: isRequiredForSocial,
    // },

    userName: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    confirmedPassword: {
      type: String,
      required: isRequired,
    },
    profile: {
      type: String,
      default: "",
    },
    contactNumber: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exist"],
    },
    role: {
      type: String,
      enum: Role,
      required: [true, "Role is required"],
    },
    passwordUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "users" }
);

// MongooseHelper.excludeFields(AdminSchema, ["firstName", "lastName"], "Admin");
MongooseHelper.applyToJSONTransform(AdminSchema);
const Admin: Model<IAdmin> = model<IAdmin>("Admin", AdminSchema);
export default Admin;
