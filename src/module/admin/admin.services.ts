import httpStatus from "http-status";
import AppError from "../../app/error/AppError";
import { idConverter } from "../../utility/idConverter";
import { TAdminUpdate } from "./admin.interface";
import Admin from "./admin.model";

const updateAdminService = async (payload: TAdminUpdate) => {
  const { id, ...updateData } = payload;
  const adminIdObject = await idConverter(id);

  if (!adminIdObject) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Admin id & vendor id is required"
    );
  }
  const foundAdmin = await Admin.findById(adminIdObject);
  if (!foundAdmin) {
    throw new AppError(httpStatus.NOT_FOUND, "No Admin has found");
  }
  Object.assign(foundAdmin, updateData);
  foundAdmin.save();
  return { Admin: foundAdmin };
};

const AdminServices = {
  updateAdminService,
};

export default AdminServices;
