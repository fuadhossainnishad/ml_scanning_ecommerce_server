import express from 'express';
import auth from '../../middleware/auth';
import EarningsController from './earnings.controller';

const router = express.Router()

router
    .route('/stats')
    .get(
        auth('Brand'),
        EarningsController.getEarningsSummary
    )

const EarningsRouter = router
export default EarningsRouter