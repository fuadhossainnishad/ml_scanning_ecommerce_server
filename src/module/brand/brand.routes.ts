import express from "express";
import BrandController from "./brand.controller";

const router = express.Router();

router
  .route('/')
  .get(
    // auth('User','Brand'),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    BrandController.getBrand);

router
  .route('/:id')
  .patch(
    // auth('User','Brand'),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    BrandController.updateBrand
  )
  .delete(
    // auth('User','Brand'),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    BrandController.updateBrand
  );



const BrandRouter = router;
export default BrandRouter;
