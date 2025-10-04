import { Request } from "express";
import multer, { FileFilterCallback } from "multer";

const storage = multer.memoryStorage();
const limits = {
  fileSize: 20 * 1024 * 1024,
};
const fileFilter = function (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) {
  const allowTypes = [
    "image/jpg",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
  ];
  console.log("multer:", file, req);

  if (allowTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error: Error = new Error(
      "Only jpg/png/jpeg/webp/svg+xml image are supported"
    );
    cb(error);
  }
};

export const upload = multer({
  storage: storage,
  limits: limits,
  fileFilter: fileFilter,
});
