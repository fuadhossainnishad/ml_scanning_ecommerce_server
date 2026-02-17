import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import AppError from "../app/error/AppError";
import catchAsync from "../utility/catchAsync";
import config from "../app/config";
import { UserPayload } from "../types/express";
import { idConverter } from "../utility/idConverter";
import { Model } from "mongoose";
import { getRoleModels } from "../utility/role.utils";

const auth = (...requireRoles: string[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    console.log("Authorization Header:", authHeader);
    console.log("Required Roles:", requireRoles);

    if (!authHeader) {
      throw new AppError(httpStatus.UNAUTHORIZED, "No token provided", "");
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    let decoded: UserPayload;
    try {
      decoded = jwt.verify(
        token,
        config.jwt_access_secret as string
      ) as UserPayload;
    } catch {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid or expired token",
        ""
      );
    }

    const { role, id, email } = decoded;
    console.log("Decoded JWT Payload:", { role, id, email });

    if (requireRoles.length && !requireRoles.includes(role)) {
      throw new AppError(httpStatus.FORBIDDEN, "Access denied", "");
    }
    console.log("Decoded Token:", decoded);

    const QueryModel = getRoleModels(role);
    if (!Model) {
      throw new AppError(httpStatus.FORBIDDEN, "Role not supported", "");
    }

    const isUserExist = await QueryModel.findOne({
      _id: await idConverter(id),
      // email,
    }).lean();

    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, `${role} not found`, "");
    }
    console.log("decode user:", isUserExist);
    req.user = isUserExist;
    next();
  });
};

export default auth;
