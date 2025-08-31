import express from "express";
import auth from "../../middleware/auth";
import AppointmentController from "./appointment.controller";

const router = express.Router();

router
  .route("/")
  .get(AppointmentController.getAllAppointment)
  .post(auth("User"), AppointmentController.createAppointment);

router.use(auth("User"));
router
  .route("/:id")
  .patch(AppointmentController.updateAppointment)
  .delete(AppointmentController.deleteAppointment);
const AppointmentRouter = router;
export default AppointmentRouter;
