import express from "express";
import auth from "../../middleware/auth";
import PostController from "./post.controller";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";

const router = express.Router();

router
  .route("/")
  .post(
    auth("Brand", "User"),
    upload.fields([{ name: "attachment", maxCount: 1 }]),
    fileHandle("attachment"),
    PostController.createPost
  )
  .get(
    auth("User", "Brand"),
    PostController.getAllPost
  )

router
  .route("/:uploadId")
  .get(
    auth("Brand", "User"),
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

const PostRouter = router;
export default PostRouter;
