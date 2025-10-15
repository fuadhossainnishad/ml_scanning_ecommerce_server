import httpStatus from "http-status";
import { TUserUpdate } from "./user.interface";
import AppError from "../../app/error/AppError";
import User from "./user.model";
import { idConverter } from "../../utility/idConverter";

const updateUserService = async (payload: TUserUpdate) => {
  const { _id, ...updateData } = payload;
  const userIdObject = await idConverter(_id);

  if (!userIdObject) {
    throw new AppError(httpStatus.NOT_FOUND, "User id is required");
  }
  const foundUser = await User.findById(userIdObject);
  if (!foundUser) {
    throw new AppError(httpStatus.NOT_FOUND, "No user has found");
  }
  if (_id.toString() !== foundUser._id.toString()) {
    throw new AppError(
      httpStatus.NOT_ACCEPTABLE,
      "Vendor does not match the car's vendor"
    );
  }
  Object.assign(foundUser, updateData);
  foundUser.save();
  return { user: foundUser };
};

const UserServices = {
  updateUserService,
};

export default UserServices;
