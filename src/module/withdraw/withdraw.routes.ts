import express from 'express';
import auth from '../../middleware/auth';

const router = express.Router()

router
    .route('/')
    .get(
        auth('Brand'),
        // EarningsController
    )

const EarningsRouter = router
export default EarningsRouter