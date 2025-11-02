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
  );

router.patch(
  '/:id',
  auth("User"),
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  CartController.updateCart
);



router.delete(
  '/:productId',
  auth("User"),
  //   validationRequest(AuthValidationSchema.playerSignUpValidation),
  CartController.deleteFromCart
)

const CartRouter = router;
export default CartRouter;
