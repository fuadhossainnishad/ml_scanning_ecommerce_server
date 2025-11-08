import express from 'express';
import auth from '../../middleware/auth';
import StatsController from './stats.controller';
import EarningsController from '../earnings/earnings.controller';
import { upload } from '../../middleware/multer/multer';
import { fileHandle } from '../../middleware/fileHandle';
const router = express.Router()

router
    .route('/scan')
    .post(
        auth('User'),
        upload.fields([{ name: 'scan', maxCount: 1 }]),
        fileHandle('scan'),
        StatsController.scanning
    );

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