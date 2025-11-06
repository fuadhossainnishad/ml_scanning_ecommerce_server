import express from 'express';
import auth from '../../middleware/auth';
import EarningsController from './withdraw.controller';

const router = express.Router()

router
    .route('/')
    .post(
        auth('Brand'),
        EarningsController.CreateWithdraw
    )

const WithdrawRouter = router
export default WithdrawRouter