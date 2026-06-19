import express from "express";
import ReportController from "./report.controller";
import auth from "../../middleware/auth";

const router = express.Router();

router.route("/").get(
  // auth("User", "Brand"),
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  ReportController.getAllReports,
);
router
  .route("/:id")
  .post(
    auth("User", "Brand"),
    ReportController.createReport,
  );

// router.patch(
//   "/update_admin",
//   //   validationRequest(AuthValidationSchema.playerSignUpValidation),
//   ReportController.getReport
// );

const ReportRouter = router;
export default ReportRouter;
