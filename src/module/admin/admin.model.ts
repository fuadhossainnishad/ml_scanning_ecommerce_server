import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IAdmin } from "./admin.interface";
import { SignupSchema } from "../auth/auth.model";


const AdminSchema: Schema = new Schema<IAdmin>(
  {
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "Admin" }
).add(SignupSchema);

// MongooseHelper.excludeFields(AdminSchema, ["firstName", "lastName"], "Admin");
MongooseHelper.preSaveHashPassword(AdminSchema);
MongooseHelper.comparePasswordIntoDb(AdminSchema);
MongooseHelper.preSaveConjugate<IAdmin>(AdminSchema);
MongooseHelper.findExistence<IAdmin>(AdminSchema);
MongooseHelper.applyToJSONTransform(AdminSchema);

const Admin: Model<IAdmin> = model<IAdmin>("Admin", AdminSchema);
export default Admin;
