import express from 'express';
import auth from '../../middleware/auth';
import RewardController from './reward.controller';
const router = express.Router()


router
    .get(
        '/',
        auth('User'),
        RewardController.getReward
    )


const RewardRouter = router
export default RewardRouter