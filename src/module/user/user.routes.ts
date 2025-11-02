import express from "express";
import UserController from "./user.controller";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";
import auth from "../../middleware/auth";

const router = express.Router();

router
  .route("/")
  .get(
    auth("User"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    UserController.getUser
  )
  .patch(
    auth("User"),
    upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "coverPhoto", maxCount: 1 }
    ]),
    fileHandle("profile"),
    fileHandle("coverPhoto"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    UserController.updateUser
  );

router
  .route("/:id")
  .get(
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    UserController.getUser
  )
  .delete(
    auth("Admin"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    UserController.deleteUser
  )
  .patch(
    auth("Admin", "User"),
    upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "coverPhoto", maxCount: 1 }
    ]),
    fileHandle("profile"),
    fileHandle("coverPhoto"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    UserController.updateUser
  );

const UserRouter = router;
export default UserRouter;
