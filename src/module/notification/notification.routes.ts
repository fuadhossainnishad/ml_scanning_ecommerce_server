import express from "express";
import NotificationController from "./notification.controller";
// import auth from "../../middleware/auth";

const router = express.Router();

// router.get(
//   "/notification",
//   //   validationRequest(AuthValidationSchema.playerSignUpValidation),
//   NotificationController.getNotification
// );

router.get(
  "/",
  // auth('Admin', 'User', 'Brand'),
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  NotificationController.getAllNotification
);

router.delete(
  "/",
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  NotificationController.deleteNotification
);

const NotificationRouter = router;
export default NotificationRouter;
