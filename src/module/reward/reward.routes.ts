// reward/reward.routes.ts
import express from 'express';
import auth from '../../middleware/auth';
import RewardController from './reward.controller';

const router = express.Router();

// Onboarding
router.post(
    '/onboarding/initiate',
    auth('User'),
    RewardController.initiateOnboarding
);

router.get(
    '/onboarding/status',
    auth('User'),
    RewardController.checkOnboardingStatus
);

// Rewards & Redemption
router.get(
    '/balance',
    auth('User'),
    RewardController.getRewards
);

router.post(
    '/redeem',
    auth('User'),
    RewardController.redeemRewards
);

router.get(
    '/history',
    auth('User'),
    RewardController.getRedemptionHistory
);

const RewardRouter = router;
export default RewardRouter;