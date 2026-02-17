import express from "express";
import AdminController from "./admin.controller";
import auth from "../../middleware/auth";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";

const router = express.Router();

router
  .route('/')
  .get(
    auth('Admin'),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    AdminController.getAdmin
  );

router.patch(
  '/',
  auth('Admin'),
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 }
  ]),
  fileHandle("profile"),
  fileHandle("coverPhoto"),
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  AdminController.updateAdmin
);

router.patch("/profile",
  auth('Admin'),
  upload.fields([{ name: "profile", maxCount: 1 }]),
  fileHandle("profile"),
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  AdminController.updateAdmin)

const AdminRouter = router;
export default AdminRouter;
