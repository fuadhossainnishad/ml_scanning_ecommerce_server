import express from 'express';
import auth from '../../middleware/auth';
import PaymentController from './payment.controller';


const router = express.Router();

router.post(
    '/card',
    auth('User'),
    PaymentController.paymentIntent
);

// router.post(
//     '/paypal',
//     auth('User'),
//     PaymentController.paymentWithSaveCard
// );

router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    PaymentController.webhooks
);

const PaymentRouter = router;
export default PaymentRouter;
