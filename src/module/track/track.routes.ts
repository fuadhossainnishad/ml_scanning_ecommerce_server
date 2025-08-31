import express from "express";
import TrackController from "./track.controller";

const router = express.Router();

router.route("/").post(TrackController.insertTrack).get(
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  TrackController.getTrack
);

router.route("/:id").patch(
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  TrackController.updateTrack
);

const TrackRouter = router;
export default TrackRouter;
