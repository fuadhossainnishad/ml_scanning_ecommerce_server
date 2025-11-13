import mongoose, { Query, Schema, Types, UpdateQuery } from "mongoose";
import PasswordUtils from "./password.utils";
import { idConverter } from "./idConverter";
import AppError from "../app/error/AppError";
import httpStatus from "http-status";
import { TRole } from "../types/express";

interface ISavePassword {
  password?: string;
  isModified(path: string): boolean;
}

const preSaveHashPassword = (schema: Schema) => {
  schema.pre<ISavePassword>("save", async function (next) {
    if (this.isModified("password") && this.password) {
      this.password = await PasswordUtils.hashPassword(
        this.password as string,
        10
      );
    }
    next();
  });
};
interface IUser {
  role?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
}
const preSaveConjugate = <T extends IUser>(schema: Schema) => {
  schema.pre<T>("save", async function (next) {
    if (this.role !== "Brand") {
      if (this.firstName && this.lastName) {
        this.userName = this.firstName + " " + this.lastName;
      }
      next();
    }
  });

  const handlePasswordInQuery = async function (
    this: Query<unknown, unknown>,
    next: () => void
  ) {
    const update = this.getUpdate();

    if (update && typeof update === "object" && !Array.isArray(update)) {
      const updateObj = update as UpdateQuery<unknown>;

      const password = updateObj.password || updateObj.$set?.password;
      if (password) {
        const hashed = await PasswordUtils.hashPassword(password, 10);
        if (updateObj.password) updateObj.password = hashed;
        if (updateObj.$set?.password) updateObj.$set.password = hashed;
      }
    }

    next();
  };

  schema.pre("findOneAndUpdate", handlePasswordInQuery);
  schema.pre("updateOne", handlePasswordInQuery);
  schema.pre("updateMany", handlePasswordInQuery);
};

const comparePasswordIntoDb = (schema: Schema) => {
  schema.methods.comparePassword = async function (
    plainPassword: string
  ): Promise<boolean> {
    return await PasswordUtils.comparePassword(plainPassword, this.password);
  };
};

const findExistence = <T>(schema: Schema) => {
  schema.statics.isExist = async function (
    id: string | mongoose.Types.ObjectId
  ): Promise<T> {
    const validId = await idConverter(id!);
    const result = await this.findById<T>(validId);
    if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Existence not found", "");
    }
    return result;
  };
};

const applyToJSONTransform = (schema: Schema) => {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
      ret.id = (doc._id as Types.ObjectId).toString();
      delete ret._id;
      delete ret.password;
      return ret;
    },
  });
};
interface DocumentWithDynamicFields extends Document {
  [key: string]: unknown;
  role?: TRole;
}

const excludeFields = (
  schema: Schema,
  excludeFields: string[],
  role: string
) => {
  schema.pre("save", async function (this: DocumentWithDynamicFields, next) {
    if (this.role && this.role === role) {
      excludeFields.forEach((field) => {
        delete this[field];
      });
    }
    next();
  });
};

// const preValidation = (schema: Schema) => {

// }

const MongooseHelper = {
  applyToJSONTransform,
  preSaveHashPassword,
  preSaveConjugate,
  comparePasswordIntoDb,
  findExistence,
  excludeFields,
  // preValidation,
};
export default MongooseHelper;
