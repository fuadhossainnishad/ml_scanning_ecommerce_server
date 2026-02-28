// withdraw/withdraw.controller.ts
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import sendResponse from '../../utility/sendResponse';
import httpStatus from 'http-status';
import AppError from "../../app/error/AppError";
import Earning from "../earnings/earnings.model";
import Withdraw from "./withdraw.model";
import config from "../../app/config";
import Order from "../order/order.model";
import { OrderStatus } from "../order/order.interface";
import { StripeConnectService } from "../stripe/stripeConnect.service";
import { WithdrawStatus } from "./withdraw.interface";
import NotificationService from "../notification/notification.service";
import { NotificationType } from "../notification/notification.interface";

// Step 1: Initiate onboarding
const initiateOnboarding: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'Brand') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only brands can onboard');
    }

    let earning = await Earning.findOne({ brandId: req.user._id });
    let stripeAccountId = earning?.stripe_account_id;

    // Create account if doesn't exist
    if (!stripeAccountId) {
        const account = await StripeConnectService.createConnectedAccount({
            email: req.user.email,
            businessName: req.user.brandName || req.user.email,
            country: 'US',
        });

        stripeAccountId = account.id;

        if (!earning) {
            earning = await Earning.create({
                brandId: req.user._id,
                stripe_account_id: stripeAccountId,
            });
        } else {
            await Earning.findByIdAndUpdate(earning._id, {
                stripe_account_id: stripeAccountId
            });
        }
    }

    // Generate onboarding link
    const accountLink = await StripeConnectService.createAccountLink({
        accountId: stripeAccountId,
        refreshUrl: `${config.frontendUrl}/stripe/refresh`,
        returnUrl: `${config.frontendUrl}/stripe/complete`,
    });
    console.log("accountLink:", accountLink)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Open the onboarding URL in a webview. The app should poll /onboarding/status to check completion.',
        data: {
            onboarding_url: accountLink.url,
            stripe_account_id: stripeAccountId,
            // Instructions for mobile app
            instructions: {
                step1: 'Open onboarding_url in a WebView',
                step2: 'Poll GET /api/v1/withdraw/onboarding/status every 3 seconds',
                step3: 'When onboarding_completed is true, close WebView',
            }
        },
    });
});

// Step 2: Check onboarding status
const checkOnboardingStatus: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'Brand') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only brands can check status');
    }

    const earning = await Earning.findOne({ brandId: req.user._id });

    if (!earning?.stripe_account_id) {
        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Onboarding status',
            data: {
                onboarding_completed: false,
                can_withdraw: false,
                message: 'Please initiate onboarding first',
            },
        });
    }

    const status = await StripeConnectService.getAccountStatus(earning.stripe_account_id);

    // Update if complete
    if (status.isReady && !earning.onboarding_completed) {
        await Earning.findByIdAndUpdate(earning._id, {
            onboarding_completed: true
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Onboarding status',
        data: {
            onboarding_completed: status.isReady,
            can_withdraw: status.isReady && earning.availableBalance > 0,
            payouts_enabled: status.payoutsEnabled,
            details_submitted: status.detailsSubmitted,
        },
    });
});

// Step 3: Get earnings
const getEarnings: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'Brand') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only brands can view earnings');
    }

    const earning = await Earning.findOne({ brandId: req.user._id });

    if (!earning) {
        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Earnings',
            data: {
                totalEarnings: 0,
                totalWithdrawn: 0,
                pendingBalance: 0,
                availableBalance: 0,
                canWithdraw: false,
            },
        });
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Earnings retrieved',
        data: {
            totalEarnings: earning.totalEarnings,
            totalWithdrawn: earning.totalWithdrawn,
            pendingBalance: earning.pendingBalance,
            availableBalance: earning.availableBalance,
            canWithdraw: earning.onboarding_completed && earning.availableBalance > 0,
        },
    });
});

// Step 4: Instant withdrawal
const instantWithdraw: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'Brand') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only brands can withdraw');
    }

    const { amount } = req.body.data;
    console.log("Amount:", Number(amount))

    if (!Number(amount) || Number(amount) <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid amount');
    }
    const MIN_WITHDRAWAL = 100;
    if (amount < MIN_WITHDRAWAL) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Minimum withdrawal is $${MIN_WITHDRAWAL}`
        );
    }

    const earning = await Earning.findOne({ brandId: req.user._id });
    console.log("earning:", earning)
    if (!earning) {
        throw new AppError(httpStatus.NOT_FOUND, 'No earnings found');
    }

    if (!earning.onboarding_completed || !earning.stripe_account_id) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Please connect your stripe account first'
        );
    }

    if (earning.availableBalance < amount) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Insufficient balance. Available: $${earning.availableBalance.toFixed(2)}`
        );
    }

    const withdrawal = await Withdraw.create({
        brandId: req.user._id,
        amount,
        currency: 'usd',
        status: WithdrawStatus.PROCESSING,
        requestedAt: new Date(),
    });

    try {
        const transfer = await StripeConnectService.transferToBrand({
            amount,
            currency: 'usd',
            destinationAccountId: earning.stripe_account_id,
            metadata: {
                withdrawalId: withdrawal._id.toString(),
                brandId: req.user._id.toString(),
                brandEmail: req.user.email,
            },
        });

        await Withdraw.findByIdAndUpdate(withdrawal._id, {
            stripe_transfer_id: transfer.id,
            status: WithdrawStatus.COMPLETED,
            processedAt: new Date(),
        });

        await Earning.findByIdAndUpdate(earning._id, {
            $inc: {
                availableBalance: -amount,
                totalWithdrawn: amount,
            },
        });

        console.log(`✅ Withdrawal: $${amount} transferred to brand ${req.user._id}`);
        await NotificationService.sendNotification({
            ownerId: req.user._id,
            receiverId: [req.user._id],
            type: NotificationType.WITHDRAWAL_SUCCESS,
            title: 'Withdraw created',
            body: `You have withdawed successfully`,
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
            message: 'Withdrawal successful! Money will arrive in your bank account according to your payout schedule.',
            data: {
                withdrawal_id: withdrawal._id,
                amount,
                currency: 'usd',
                stripe_transfer_id: transfer.id,
                status: 'completed',
                new_available_balance: earning.availableBalance - amount,
            },
        });

    } catch (error: any) {
        console.error('Withdrawal error:', error);

        await Withdraw.findByIdAndUpdate(withdrawal._id, {
            status: WithdrawStatus.FAILED,
            failureReason: error.message,
            processedAt: new Date(),
        });

        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Withdrawal failed: ${error.message}`
        );
    }
});

// Step 5: Withdrawal history
const getWithdrawalHistory: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'Brand') {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Only brands can view history');
    }

    const { page = 1, limit = 20 } = req.query;

    const withdrawals = await Withdraw.find({
        brandId: req.user._id,
        isDeleted: false,
    })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

    const total = await Withdraw.countDocuments({
        brandId: req.user._id,
        isDeleted: false,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Withdrawal history',
        data: {
            withdrawals,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        },
    });
});

// Admin: Release funds
const releaseEscrow: RequestHandler = catchAsync(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Order ID required');
    }

    const order = await Order.findById(orderId).populate({
        path: 'cartId',
        populate: 'products.productId',
    });

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (order.orderStatus !== OrderStatus.DELIVERED) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Order must be delivered first');
    }

    const cart = order.cartId as any;
    const PLATFORM_FEE_RATE = 0.10;
    const brandAmounts = new Map<string, number>();

    for (const product of cart.products) {
        const sellerId = product.sellerId || product.productId?.sellerId;
        if (!sellerId) continue;

        const productTotal = product.price * product.quantity;
        const brandAmount = productTotal * (1 - PLATFORM_FEE_RATE);

        brandAmounts.set(
            sellerId.toString(),
            (brandAmounts.get(sellerId.toString()) || 0) + brandAmount
        );
    }

    for (const [brandId, amount] of brandAmounts) {
        await Earning.findOneAndUpdate(
            { brandId },
            {
                $inc: {
                    pendingBalance: -amount,
                    availableBalance: amount,
                },
            }
        );

        console.log(`✅ Released $${amount} for brand ${brandId}`);
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Funds released and available for withdrawal',
        data: {
            orderId,
            brandsUpdated: brandAmounts.size,
        },
    });
});

// EXPORT ALL FUNCTIONS PROPERLY
const WithdrawController = {
    initiateOnboarding,
    checkOnboardingStatus,
    getEarnings,
    instantWithdraw,
    getWithdrawalHistory,
    releaseEscrow,
};

export default WithdrawController;