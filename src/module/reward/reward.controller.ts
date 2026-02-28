// reward/reward.controller.ts
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import sendResponse from '../../utility/sendResponse';
import httpStatus from 'http-status';
import AppError from "../../app/error/AppError";
import Reward from "./reward.model";
import { RedeemStatus } from "./reward.interface";
import { StripeConnectService } from "../stripe/stripeConnect.service";
import config from "../../app/config";
import Redemption from "./redemption.model";
import NotificationService from "../notification/notification.service";
import { NotificationType } from "../notification/notification.interface";

// Step 1: Initiate Stripe Connect onboarding for user
const initiateOnboarding: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'User') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only users can onboard');
    }

    let reward = await Reward.findOne({ userId: req.user._id });
    let stripeAccountId = reward?.stripe_account_id;

    if (!stripeAccountId) {
        const account = await StripeConnectService.createConnectedAccount({
            email: req.user.email,
            businessName: `${req.user.firstName} ${req.user.lastName}`,
            country: 'US',
        });

        stripeAccountId = account.id;

        if (!reward) {
            reward = await Reward.create({
                userId: req.user._id,
                stripe_account_id: stripeAccountId,
            });
        } else {
            await Reward.findByIdAndUpdate(reward._id, {
                stripe_account_id: stripeAccountId
            });
        }
    }

    const backendUrl = config.frontendUrl

    const accountLink = await StripeConnectService.createAccountLink({
        accountId: stripeAccountId,
        refreshUrl: `${backendUrl}/stripe/refresh`,
        returnUrl: `${backendUrl}/stripe/return`,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Complete onboarding to redeem rewards',
        data: {
            onboarding_url: accountLink.url,
            stripe_account_id: stripeAccountId,
            instructions: {
                step1: 'Open onboarding_url in a WebView',
                step2: 'Poll GET /api/v1/reward/onboarding/status every 3 seconds',
                step3: 'When onboarding_completed is true, close WebView',
            }
        },
    });
});

// Step 2: Check onboarding status
const checkOnboardingStatus: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'User') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only users can check status');
    }

    const reward = await Reward.findOne({ userId: req.user._id });

    if (!reward?.stripe_account_id) {
        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Onboarding status',
            data: {
                onboarding_completed: false,
                can_redeem: false,
                message: 'Please initiate onboarding first',
            },
        });
    }

    const status = await StripeConnectService.getAccountStatus(reward.stripe_account_id);

    if (status.isReady && !reward.onboarding_completed) {
        await Reward.findByIdAndUpdate(reward._id, {
            onboarding_completed: true
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Onboarding status',
        data: {
            onboarding_completed: status.isReady,
            can_redeem: status.isReady && reward.availableRewards >= 100,
            payouts_enabled: status.payoutsEnabled,
            details_submitted: status.detailsSubmitted,
        },
    });
});

// Step 3: Get reward balance
const getRewards: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'User') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only users can view rewards');
    }

    const reward = await Reward.findOne({ userId: req.user._id });

    if (!reward) {
        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Rewards balance',
            data: {
                totalSpent: 0,
                totalEarned: 0,
                totalRedeemed: 0,
                pendingRewards: 0,
                availableRewards: 0,
                redeemableAmount: 0,
                canRedeem: false,
                onboarding_completed: false,
            },
        });
    }

    // Calculate redeemable cash amount (1% of points)
    const CONVERSION_RATE = 0.01; // 100 points = $1
    const redeemableAmount = reward.availableRewards * CONVERSION_RATE;

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Rewards retrieved',
        data: {
            totalSpent: reward.totalSpent,
            totalEarned: reward.totalEarned,
            totalRedeemed: reward.totalRedeemed,
            pendingRewards: reward.pendingRewards,
            availableRewards: reward.availableRewards,
            redeemableAmount: Number(redeemableAmount.toFixed(2)),
            canRedeem: reward.onboarding_completed && reward.availableRewards >= 100,
            onboarding_completed: reward.onboarding_completed,
            conversionRate: '100 points = $1',
        },
    });
});

// Step 4: Redeem ALL available rewards (no input needed)
const redeemRewards: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'User') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only users can redeem rewards');
    }

    const reward = await Reward.findOne({ userId: req.user._id });

    if (!reward) {
        throw new AppError(httpStatus.NOT_FOUND, 'No rewards found');
    }

    if (!reward.onboarding_completed || !reward.stripe_account_id) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Please connect your Stripe account first'
        );
    }

    // Check minimum points requirement
    const MIN_POINTS = 100;
    if (reward.availableRewards < MIN_POINTS) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Minimum ${MIN_POINTS} points required to redeem. You have ${reward.availableRewards} points.`
        );
    }

    // Calculate cash amount (1% of points)
    const CONVERSION_RATE = 0.01;
    const pointsToRedeem = reward.availableRewards;
    const cashAmount = Number((pointsToRedeem * CONVERSION_RATE).toFixed(2));

    // Minimum cash amount check
    const MIN_CASH = 1; // $1 minimum
    if (cashAmount < MIN_CASH) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Minimum redemption is $${MIN_CASH}. You have $${cashAmount} (${pointsToRedeem} points).`
        );
    }

    console.log(`🎁 Redeeming ${pointsToRedeem} points → $${cashAmount} for user ${req.user._id}`);

    const redemption = await Redemption.create({
        userId: req.user._id,
        amount: cashAmount,
        pointsRedeemed: pointsToRedeem,
        currency: 'usd',
        status: RedeemStatus.PROCESSING,
        requestedAt: new Date(),
    });

    try {
        // Transfer cash to user's Stripe account
        const transfer = await StripeConnectService.transferToBrand({
            amount: cashAmount,
            currency: 'usd',
            destinationAccountId: reward.stripe_account_id,
            metadata: {
                redemptionId: redemption._id.toString(),
                userId: req.user._id.toString(),
                userEmail: req.user.email,
                pointsRedeemed: pointsToRedeem.toString(),
                conversionRate: '0.01',
                type: 'reward_redemption'
            },
        });

        await Redemption.findByIdAndUpdate(redemption._id, {
            stripe_transfer_id: transfer.id,
            status: RedeemStatus.COMPLETED,
            processedAt: new Date(),
        });

        await Reward.findByIdAndUpdate(reward._id, {
            $inc: {
                availableRewards: -pointsToRedeem,
                totalRedeemed: cashAmount,
            },
        });

        console.log(`✅ Redemption successful: ${pointsToRedeem} points → $${cashAmount}`);

        await NotificationService.sendNotification({
            ownerId: req.user._id,
            receiverId: [req.user._id],
            type: NotificationType.REWARD_REDEEMED,
            title: 'Reward redeemed',
            body: `You have redeemed reward successfully`,
            data: {
                userId: req.user._id.toString(),
                role: req.user.role,
                action: 'created',
                time: new Date().toISOString()
            },
            notifyAdmin: true
        });

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Rewards redeemed successfully! Money will arrive in your bank account.',
            data: {
                redemption_id: redemption._id,
                points_redeemed: pointsToRedeem,
                cash_amount: cashAmount,
                currency: 'usd',
                stripe_transfer_id: transfer.id,
                status: 'completed',
                new_available_rewards: 0,
                conversion_rate: '100 points = $1',
            },
        });

    } catch (error: any) {
        console.error('Redemption error:', error);

        await Redemption.findByIdAndUpdate(redemption._id, {
            status: RedeemStatus.FAILED,
            failureReason: error.message,
            processedAt: new Date(),
        });

        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Redemption failed: ${error.message}`
        );
    }
});

// Step 5: Redemption history
const getRedemptionHistory: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'User') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only users can view history');
    }

    const { page = 1, limit = 20 } = req.query;

    const redemptions = await Redemption.find({
        userId: req.user._id,
        isDeleted: false,
    })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

    const total = await Redemption.countDocuments({
        userId: req.user._id,
        isDeleted: false,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Redemption history',
        data: {
            redemptions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        },
    });
});

const RewardController = {
    initiateOnboarding,
    checkOnboardingStatus,
    getRewards,
    redeemRewards,
    getRedemptionHistory,
};

export default RewardController;