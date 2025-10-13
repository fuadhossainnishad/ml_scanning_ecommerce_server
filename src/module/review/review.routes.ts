import express from "express";
import ReviewController from "./review.controller";
import auth from "../../middleware/auth";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";

const router = express.Router();

router
  .route("/:id")
  .post(
    auth('User'),
    upload.fields([{name:"attachment",maxCount:10}]),
    fileHandle("attachment"),
    ReviewController.createReview
  )

router
  .route("/")
  .get(
    auth('User', 'Brand'),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    ReviewController.getReview
  );

// router.patch(
//   "/update_admin",
//   //   validationRequest(AuthValidationSchema.playerSignUpValidation),
//   ReviewController.getReview
// );

const ReviewRouter = router;
export default ReviewRouter;
