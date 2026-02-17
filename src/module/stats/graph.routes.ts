import express from 'express';
import auth from '../../middleware/auth';
import EarningsController from '../earnings/earnings.controller';
import StatsController from './stats.controller';
const router = express.Router()

// router
//     .route('/brandlist')
//     .get(
//         auth('User'),
//         StatsController.appFirstStats
//     )

router
    .get(
        '/earnings',
        auth('Brand'),
        EarningsController.getMonthlyEarnings
    )
router
    .get(
        '/orders',
        auth('Brand'),
        StatsController.getMonthlyProductOrders
    )


const GraphsRouter = router
export default GraphsRouter