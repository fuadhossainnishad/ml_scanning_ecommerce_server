import express from 'express';
import auth from '../../middleware/auth';
import StatsController from './stats.controller';
const router = express.Router()

router
    .route('/brandlist')
    .get(
        auth('User'),
        StatsController.appFirstStats
    )

router
    .get(
        '/:brandId',
        // auth('User'),
        StatsController.getRelatedBrands
    )

const StatsRouter = router
export default StatsRouter