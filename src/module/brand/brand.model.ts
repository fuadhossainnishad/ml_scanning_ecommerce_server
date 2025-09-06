import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IBrand } from "./brand.interface";
import { SignupSchema } from "../auth/auth.model";


const BrandSchema: Schema = new Schema<IBrand>(
  {
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "Brand" }
).add(SignupSchema);

// MongooseHelper.excludeFields(AdminSchema, ["firstName", "lastName"], "Admin");
MongooseHelper.applyToJSONTransform(BrandSchema);

const Brand: Model<IBrand> = model<IBrand>("Brand", BrandSchema);
export default Brand;
