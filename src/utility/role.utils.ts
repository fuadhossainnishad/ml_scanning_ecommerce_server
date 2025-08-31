import { Model } from "mongoose";
import { TRole } from "../types/express";
import User from "../module/user/user.model";
import Admin from "../module/admin/admin.model";
import { IUser } from "../module/user/user.interface";
import { IAdmin } from "../module/admin/admin.interface";

export const getRoleModels = (role: TRole): Model<IAdmin | IUser> => {
  const roleModels: Partial<Record<TRole, Model<IUser | IAdmin>>> = {
    User: User as Model<IUser | IAdmin>,
    Admin: Admin as Model<IUser | IAdmin>,
  };
  return roleModels[role]!;
};
