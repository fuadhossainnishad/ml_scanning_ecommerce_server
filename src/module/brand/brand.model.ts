import { Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IBrand } from "./brand.interface";
import Admin from "../admin/admin.model";


const BrandSchema: Schema = new Schema<IBrand>(
  {
    brandName: { type: String, required: function (this: IBrand) { return this.role === 'Brand'; } },
    brandLogo: {
      type: [String],
      // required: false,
      // default: "",
      required: function (this: IBrand) { return this.role === 'Brand'; },
      validate: {
        validator: function (value: string[]) {
          if (this.role === "Brand" && value.length !== 1) return false;
          return true;
        },
        message: "brandLogo is required for Brand"
      }
    },
    brandStory: {
      type: String,
      default: ""
    },
    theme: {
      type: String,
      default: ""
    },
    stripe_accounts_id: {
      type: String,
      required: true,
      default: ""
    },
    pickupAddress: {
      type: new Schema(
        {
          name: { type: String, required: true },
          email: { type: String, required: true },
          phone: { type: String, required: true },
          address: { type: String, required: true },
        },
        { _id: false }
      ),
    },
    pickupAddressCode: { type: Number },
  }
  , { timestamps: true, collection: "brands" }
);

// MongooseHelper.excludeFields(AdminSchema, ["firstName", "lastName"], "Admin");
MongooseHelper.preSaveConjugate<IBrand>(BrandSchema);
MongooseHelper.findExistence<IBrand>(BrandSchema);
MongooseHelper.applyToJSONTransform(BrandSchema);

const Brand: Model<IBrand> = Admin.discriminator<IBrand>("Brand", BrandSchema);
export default Brand;
