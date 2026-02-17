import { Request, Response, NextFunction } from "express";
import { File } from "multer";
import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../../module/user/user.interface";
import { LeanDocument } from "mongoose";
import { IAdmin } from "../../module/admin/admin.interface";
import { Role } from "../../module/auth/auth.interface";

export type TRole = (typeof Role)[number];

export interface UserPayload extends JwtPayload {
  id: string;
  email: string;
  role: TRole;
}

export type AuthPayload = UserPayload;

export interface RequestWithFiles extends Request {
  user?: LeanDocument<IUser | IAdmin>;
  files?: { [fieldname: string]: File[] } | File[] | undefined;
}

export type RequestHandlerWithFiles = (
  req: RequestWithFiles,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

declare global {
  namespace Express {
    interface Request {
      user?: LeanDocument<IUser | IAdmin>;
    }
  }
}
