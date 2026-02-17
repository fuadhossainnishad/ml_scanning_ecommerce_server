import express from "express";
import auth from "../../middleware/auth";
import FollowController from "./follow.controller";

const router = express.Router();

router
  .route("/")
  .get(
    auth("User", "Brand"),
    FollowController.getAllFollow
  )

router
  .route("/:id")
  .post(
    auth("User", "Brand"),
    FollowController.createFollow
  )
  .patch(
    auth("User", "Brand"),
    FollowController.updateFollow
  )
  .delete(
    auth("User", "Brand"),
    FollowController.deleteFollow
  )

const FollowRouter = router;
export default FollowRouter;
