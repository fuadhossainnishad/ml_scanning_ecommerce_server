import express from "express";
import AdminController from "./admin.controller";

const router = express.Router();

router.get(
  "/get_admin",
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  AdminController.getAdmin
);

router.patch(
  "/update_admin",
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  AdminController.updateAdmin
);

const AdminRouter = router;
export default AdminRouter;
