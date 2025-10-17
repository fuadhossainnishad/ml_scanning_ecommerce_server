import express from "express";
import CartController from "./cart.controller";
import auth from "../../middleware/auth";

const router = express.Router();

router.route('/')
  .get(
    auth("User"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    CartController.getCart
  )
  .post(
    auth("User"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    CartController.uploadCart
  )
  .put(
    auth("User"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    CartController.uploadCart
  );

// router.patch(
//   "/update_admin",
//   //   validationRequest(AuthValidationSchema.playerSignUpValidation),
//   AdminController.updateAdmin
// );

const CartRouter = router;
export default CartRouter;
