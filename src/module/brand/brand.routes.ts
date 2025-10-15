import express from "express";
import BrandController from "./brand.controller";
import auth from "../../middleware/auth";
import { upload } from "../../middleware/multer/multer";
import { fileHandle } from "../../middleware/fileHandle";

const router = express.Router();

router
  .route('/')
  .get(
    auth('User', 'Brand'),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    BrandController.getBrand
  )
  .patch(
    auth('Brand'),
    upload.fields([{ name: "profile", maxCount: 1 }]),
    fileHandle("profile"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    BrandController.updateBrand
  )

router
  .route('/:id')
  .delete(
    // auth('User','Brand'),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    BrandController.updateBrand
  );



const BrandRouter = router;
export default BrandRouter;
