import { model, Schema } from "mongoose";
import { IOtp, ISignup, Role } from './auth.interface';
import MongooseHelper from "../../utility/mongoose.helpers";

const isRequired = function (this: ISignup): boolean {
  return this.role === 'Provider'
}

export const SignupSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email already exist"],
  },
  password: {
    type: String,
    required: true,
  },
  passwordUpdatedAt: {
    type: Date,
    default: Date.now,
  },
  confirmedPassword: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Role,
    required: [true, "Role is required"],
  },
  firstName: {
    type: String,
    required: !isRequired,
  },
  lastName: {
    type: String,
    required: !isRequired,
  },
  userName: {
    type: String,
    default: ""
  },
  profile: {
    type: String,
    required: !isRequired,
    default: '',
  },
  brandName: {
    type: String,
    required: isRequired,
  },
  brandLogo: {
    type: String,
    required: isRequired,
  },
  mobile: {
    type: String,
    required: true,
  },
  countryCode: {
    type: String,
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
})

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
