import express from "express";
import UserController from "./user.controller";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";

const router = express.Router();

router
  .route("/")
  .get(
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    UserController.getUser
  )
  .patch(
    upload.fields([{ name: "photo", maxCount: 1 }]),
    fileHandle("photo"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    UserController.updateUser
  );

router.delete(
  "/:id",
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  UserController.deleteUser
);

const UserRouter = router;
export default UserRouter;
