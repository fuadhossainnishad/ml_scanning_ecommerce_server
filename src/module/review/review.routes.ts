import express from "express";
import ReviewController from "./review.controller";
import auth from "../../middleware/auth";

const router = express.Router();

router
  .route("/:id")
  .post(
    auth('User'),
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

const AdminRouter = router;
export default AdminRouter;
