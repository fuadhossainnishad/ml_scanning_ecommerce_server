import express from "express";
import validationRequest from "../../middleware/validationRequest";
import AuthValidationSchema from "./auth.validation";
import AuthController from "./auth.controller";
import auth from "../../middleware/auth";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";


const router = express.Router();

router.post(
  "/signup",
  // validationRequest(AuthValidationSchema.userSignInValidation),
  upload.fields([{ name: "brandLogo", maxCount: 1 }]),
  // fileHandle("profile"),
  fileHandle("brandLogo"),
  AuthController.signUp,
  // RewardController.insertReward
);

router.post(
  "/login",
  // validationRequest(AuthValidationSchema.userSignInValidation),
  AuthController.login
);

router.post(
  "/forget_password",
  validationRequest(AuthValidationSchema.forgotPasswordValidation),
  AuthController.requestForgotPassword
);

router.post(
  "/verify_otp",
  // validationRequest(AuthValidationSchema.verifyOtpdValidation),
  AuthController.verifyOtp
);

router.put(
  "/reset_password",
  auth("User", "Brand", "Admin"),
  // validationRequest(AuthValidationSchema.resetPasswordValidation),
  AuthController.resetPassword
);

router.patch(
  "/update_password",
  auth("User", "Brand", "Admin"),
  // validationRequest(AuthValidationSchema.updatePasswordValidation),
  AuthController.updatePassword
);

router.patch(
  "/fcm",
  auth("User", "Brand", "Admin"),
  // validationRequest(AuthValidationSchema.updatePasswordValidation),
  AuthController.updateFcm
);

const AuthRouter = router;

export default AuthRouter;
