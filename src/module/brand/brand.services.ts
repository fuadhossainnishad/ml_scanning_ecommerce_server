// import httpStatus from "http-status";
// import AppError from "../../app/error/AppError";
// import { idConverter } from "../../utility/idConverter";
// import Admin from "./brand.model";
// import { TAdminUpdate } from "../admin/admin.interface";

// const updateAdminService = async (payload: TAdminUpdate) => {
//   const { adminId, ...updateData } = payload;
//   const adminIdObject = await idConverter(adminId);

//   if (!adminIdObject) {
//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       "Admin id & vendor id is required"
//     );
//   }
//   const foundAdmin = await Admin.findById(adminIdObject);
//   if (!foundAdmin) {
//     throw new AppError(httpStatus.NOT_FOUND, "No Admin has found");
//   }
//   Object.assign(foundAdmin, updateData);
//   foundAdmin.save();
//   return { Admin: foundAdmin };
// };

// const AdminServices = {
//   updateAdminService,
// };

// export default AdminServices;
