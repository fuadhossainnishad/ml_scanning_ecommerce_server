import express from "express";
import auth from "../../middleware/auth";
import SavePostController from "./Save.controller";

const router = express.Router();

router
  .route("/")
  .get(
    auth("User", "Brand"),
    SavePostController.getAllSavePost
  )

router
  .route("/:id")
  .post(
    auth("Brand", "User"),
    SavePostController.createSavePost
  )
  .patch(
    auth("Brand", "User"),
    SavePostController.updateSavePost
  )
  .delete(
    auth("Brand", "User"),
    SavePostController.deleteSavePost
  )

const SavePostRouter = router;
export default SavePostRouter;
