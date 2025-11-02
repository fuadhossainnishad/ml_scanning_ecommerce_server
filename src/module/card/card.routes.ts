import express from "express";
import auth from "../../middleware/auth";
import CardController from "./card.controller";

const router = express.Router();

router.route('/')
    .get(
        auth("User"),
        //   validationRequest(AuthValidationSchema.playerSignUpValidation),
        CardController.getSavedPaymentMethods
    );

router.get(
    '/setup',
    auth("User"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    CardController.setupIntent
);

router.post(
    '/:id',
    auth("User"),
    //   validationRequest(AuthValidationSchema.playerSignUpValidation),
    CardController.savePaymentMethod
);


// router.delete(
//     '/:productId',
//     auth("User"),
//     //   validationRequest(AuthValidationSchema.playerSignUpValidation),
//     CardController.getSavedPaymentMethods
// );

const CardRouter = router;
export default CardRouter;
