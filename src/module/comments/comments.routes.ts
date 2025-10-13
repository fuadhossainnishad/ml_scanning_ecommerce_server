import express from "express";
import auth from "../../middleware/auth";
import CommentsController from "./comments.controller";

const router = express.Router();

router
  .route("/")
  .get(
    auth("User", "Brand"),
    CommentsController.getAllComments
  )

router
  .route("/:id")
  .post(
    auth("Brand", "User", "Admin"),
    CommentsController.createComments
  )
  .patch(
    auth("Brand", "User", "Admin"),
    CommentsController.updateComments
  )
  .delete(
    auth("Brand"),
    CommentsController.deleteComments
  )

// router.post(
//   "/webhook",
//   express.raw({ type: "applicaton/json" }),
//   //   validationRequest(AuthValidationSchema.playerSignUpValidation),
//   PostController.Webhook
// );

const CommentsRouter = router;
export default CommentsRouter;
