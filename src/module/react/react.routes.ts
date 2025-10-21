import express from "express";
import auth from "../../middleware/auth";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";
import ReactController from "./react.controller";

const router = express.Router();

router
  .route("/")
  .get(auth("User", "Brand"), ReactController.getAllReact
  );

router
  .route("/:id")
  .post(auth("Brand", "User"), ReactController.createReact)
  .patch(
    auth("Brand"),
    upload.fields([{ name: "attachement", maxCount: 1 }]),
    fileHandle("attachement"),
    ReactController.createReact
  )
  .delete(auth("Brand"), ReactController.createReact);

const ReactRouter = router;
export default ReactRouter;
