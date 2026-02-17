import express from "express";

import SettingsController from "./settings.controller";
import validationRequest from '../../middleware/validationRequest';
import SettingsValidationSchema from "./settings.zod.validation";

const router = express.Router();

router
  .route("/")
  .get(SettingsController.getSettings)
  .put(validationRequest(SettingsValidationSchema.upsertSettingsValidation), SettingsController.upsertSettings);

const SettingsRouter = router;
export default SettingsRouter;
