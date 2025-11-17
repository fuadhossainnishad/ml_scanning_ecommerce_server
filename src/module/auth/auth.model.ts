import { model, Schema } from "mongoose";
import { IOtp, ISignup, Role } from './auth.interface';
import MongooseHelper from "../../utility/mongoose.helpers";
import { IUser } from "../user/user.interface";


export const SignupSchema: Schema = new Schema<IUser>({
  email: { type: String, required: [true, "Email is required"], unique: true },
  password: { type: String, required: true },
  confirmedPassword: { type: String, required: true },
  role: {
    type: String, enum: Role, required: [true, "Role is required"], default: 'User'
  },
  firstName: {
    type: String,
    required: function (this: ISignup) { return this.role === 'User'; }
  },
  lastName: {
    type: String,
    required: function (this: ISignup) { return this.role === 'User'; }
  },
  userName: { type: String, default: "" },
  profile: { type: [String], default: [] },
  coverPhoto: { type: [String], default: [] },
  mobile: { type: String, required: true },
  countryCode: { type: String, required: true },
  passwordUpdatedAt: { type: Date, default: Date.now },
  stripe_customer_id: {
    type: String,
    required: function (this: ISignup) {
      return this.role !== 'Admin'
    },
  },
  last_login: { type: Date, default: Date.now },
  failed_attempts: { type: Number, default: 0 },
  fcm: { type: String, default: "" },
});

const OtpSchema = new Schema<IOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [false, "User ID is not required"],
    },
    email: {
      type: String,
      required: [true, "Email is Not Required"],
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "0" },
    },
  },
  { timestamps: true }
);

MongooseHelper.applyToJSONTransform(OtpSchema);

const Otp = model<IOtp>("Otp", OtpSchema);
export default Otp;
