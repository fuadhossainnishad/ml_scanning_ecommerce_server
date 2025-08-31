import { model, Schema } from "mongoose";
import { IOtp } from "./auth.interface";
import MongooseHelper from "../../utility/mongoose.helpers";

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
