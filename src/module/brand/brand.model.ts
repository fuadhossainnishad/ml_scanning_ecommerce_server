import { Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IBrand } from "./brand.interface";
import Admin from "../admin/admin.model";


const BrandSchema: Schema = new Schema<IBrand>({
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

// MongooseHelper.excludeFields(AdminSchema, ["firstName", "lastName"], "Admin");
MongooseHelper.applyToJSONTransform(BrandSchema);

const Brand: Model<IBrand> = Admin.discriminator<IBrand>("Brand", BrandSchema);
export default Brand;
