import express from "express";
import NotificationController from "./notification.controller";

const router = express.Router();

router.get(
  "/get_notification",
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  NotificationController.getNotification
);
router.get(
  "/get_all_notification",
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  NotificationController.getAllNotification
);

router.delete(
  "/delete_notification",
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  NotificationController.deleteNotification
);

const NotificationRouter = router;
export default NotificationRouter;
