import express from "express";
import auth from "../../middleware/auth";
import PostController from "./react.controller";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";

const router = express.Router();

router
  .route("/")
  .post(
    auth("Brand"),
    upload.fields([{ name: "attachement", maxCount: 1 }]),
    fileHandle("attachement"),
    PostController.createPost
  )
  .get(
    auth("User", "Brand"),
    PostController.getAllPost
  )

router
  .route("/:id")
  .patch(
    auth("Brand"),
    upload.fields([{ name: "attachement", maxCount: 1 }]),
    fileHandle("attachement"),
    PostController.deletePost
  )
  .delete(
    auth("Brand"),
    PostController.deletePost
  )

// router.post(
//   "/webhook",
//   express.raw({ type: "applicaton/json" }),
//   //   validationRequest(AuthValidationSchema.playerSignUpValidation),
//   PostController.Webhook
// );

const ReactRouter = router;
export default ReactRouter;
