import { Model } from "mongoose";
import { TRole } from "../types/express";
import User from "../module/user/user.model";
import Admin from "../module/admin/admin.model";
import { IUser } from "../module/user/user.interface";
import { IAdmin } from "../module/admin/admin.interface";
import { IBrand } from "../module/brand/brand.interface";
import Brand from "../module/brand/brand.model";

export const getRoleModels = (role: TRole): Model<IAdmin | IUser | IBrand> => {
  const roleModels: Partial<Record<TRole, Model<IUser | IAdmin | IBrand>>> = {
    User: User as Model<IUser | IAdmin | IBrand>,
    Admin: Admin as Model<IUser | IAdmin | IBrand>,
    Brand: Brand as Model<IUser | IAdmin | IBrand>,

  };
  return roleModels[role]!;
};
