import express from 'express';
import auth from '../../middleware/auth';
import StatsController from './stats.controller';
import EarningsController from '../earnings/earnings.controller';
const router = express.Router()

router
    .route('/brandlist')
    .get(
        auth('User', 'Brand'),
        StatsController.appFirstStats
    );

router.get(
    '/orders',
    auth('Brand'),
    StatsController.getBrandStats
)
    .get('/earnings',
        auth('Brand'),
        EarningsController.getEarningsSummary
    );


router
    .get(
        '/:brandId',
        // auth('User'),
        StatsController.getRelatedBrands
    );



const StatsRouter = router
export default StatsRouter