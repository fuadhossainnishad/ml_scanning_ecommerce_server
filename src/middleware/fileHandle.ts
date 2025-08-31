import { fileUploadToS3 } from "../utility/uploadFile";
import catchAsync from "../utility/catchAsync";
import { RequestHandler } from "express";
import AppError from "../app/error/AppError";

export const fileHandle = (fieldName: string): RequestHandler =>
  catchAsync(async (req, res, next) => {
    if (typeof req.body.data === "string") {
      try {
        req.body.data = JSON.parse(req.body.data);
      } catch (error) {
        let errorMessage = "Unknown JSON parse error";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        throw new AppError(400, "Invalid JSON in data field", errorMessage);
      }
    }
    const files = (req.files as Record<string, Express.Multer.File[]>)[
      fieldName
    ];
    if (!files || files.length === 0) {
      req.body.data[`${fieldName}Urls`] = [];
      return next();
    }
    const fileList = [];
    for (const file of files) {
      const url = await fileUploadToS3(
        file.buffer,
        file.originalname,
        fieldName
      );
      fileList.push(url);
    }
    req.body.data[`${fieldName}`] = fileList;
    next();
  });
