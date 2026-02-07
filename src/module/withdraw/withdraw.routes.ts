// withdraw/withdraw.routes.ts
import express from 'express';
import auth from '../../middleware/auth';
import WithdrawController from './withdraw.controller';

const router = express.Router();

// Onboarding
router.post(
    '/onboarding/initiate',
    auth('Brand'),
    WithdrawController.initiateOnboarding
);

router.get(
    '/onboarding/status',
    auth('Brand'),
    WithdrawController.checkOnboardingStatus
);

// Earnings & Withdrawal
router.get(
    '/earnings',
    auth('Brand'),
    WithdrawController.getEarnings
);

router.post(
    '/withdraw',
    auth('Brand'),
    WithdrawController.instantWithdraw
);

router.get(
    '/history',
    auth('Brand'),
    WithdrawController.getWithdrawalHistory
);

// Admin
router.post(
    '/release-funds',
    auth('Admin'),
    WithdrawController.releaseEscrow
);



// router
//     .route('/')
//     .post(
//         auth('Brand'),
//         EarningsController.CreateWithdraw
//     )

const WithdrawRouter = router
export default WithdrawRouter