import { NextFunction, RequestHandler } from "express"
import catchAsync from "../../utility/catchAsync"
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import GenericService from '../../utility/genericService.helpers';
import sendResponse from '../../utility/sendResponse';
import Order from './order.model';
import { IOrder, RemindeStatus, SellerStatus } from "./order.interface";
import { idConverter } from "../../utility/idConverter";
import OrderServices from "./order.services";
import { Types } from "mongoose";
import Earning from "../earnings/earnings.model";
import Reward from "../reward/reward.model";

const getOrders: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
        );
    }

    // const query = {
    //     ...req.query,
    //     paymentStatus: PaymentStatus.PAID
    // }

    // const result = await GenericService.findAllResources<IOrder>(Order, query, [])

    const result = await OrderServices.getOrderService(req)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Successfully retirieve order data",
        data: result,
    });
})

const updateStatus: RequestHandler = catchAsync(async (req, res, next: NextFunction) => {
    if (req.user.role !== 'Brand') {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated brand is required",
        );
    }

    const { cartProductId, sellerStatus } = req.body.data

    if (!cartProductId || !sellerStatus) {
        throw new AppError(httpStatus.BAD_REQUEST, 'cartProductId and sellerStatus are required');
    }
    const query = {
        items: {
            $elemMatch: {
                cartProductId: await idConverter(cartProductId),
                sellerStatus: sellerStatus,
            },
        },
    };

    const nextSellerStatusMap: Record<SellerStatus, SellerStatus | null> = {
        [SellerStatus.MARK_READY]: SellerStatus.MARK_FOR_SHIPPING,
        [SellerStatus.MARK_FOR_SHIPPING]: SellerStatus.MARK_FOR_COMPLETE,
        [SellerStatus.MARK_FOR_COMPLETE]: SellerStatus.DELIVERED,
        [SellerStatus.DELIVERED]: null,

    };

    const nextSellerStatus = nextSellerStatusMap[sellerStatus as SellerStatus];
    if (!nextSellerStatus) {
        throw new AppError(httpStatus.BAD_REQUEST, `No valid transition from sellerStatus: ${sellerStatus}`);
    }

    // Define corresponding remindStatus for the next sellerStatus
    const remindStatusMap: Record<SellerStatus, RemindeStatus> = {
        [SellerStatus.MARK_READY]: RemindeStatus.PROCESSING,
        [SellerStatus.MARK_FOR_SHIPPING]: RemindeStatus.READY_TO_SHIP,
        [SellerStatus.MARK_FOR_COMPLETE]: RemindeStatus.READY_TO_DELIVERED,
        [SellerStatus.DELIVERED]: RemindeStatus.DELIVERED,
    };

    const newRemindStatus = remindStatusMap[nextSellerStatus];


    const findOrders = await GenericService.findAllResources<IOrder>(Order, query, ['items.cartProductId', 'items.sellerStatus'])

    console.log(findOrders);

    if (!findOrders || !findOrders.order || findOrders.meta.total === 0) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order item not found or status not matchng');
    }

    const updateResult = await Order.updateMany(
        query,
        {
            $set: {
                'items.$[elem].sellerStatus': nextSellerStatus,
                'items.$[elem].remindStatus': newRemindStatus,
                updatedAt: new Date(),
            },
        },
        {
            arrayFilters: [
                {
                    'elem.cartProductId': await idConverter(cartProductId),
                    'elem.sellerStatus': sellerStatus,
                },
            ],
        }
    );
    if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
        throw new AppError(httpStatus.NOT_FOUND, `Failed to update item in order: ${findOrders.order}`);
    }

    const result = await OrderServices.getOrderService(req)




    if (nextSellerStatus === SellerStatus.DELIVERED) {
        req.body.data.orderUpdateData = {
            updatedOrders: result,
            cartProductId: await idConverter(cartProductId),
            userId: req.user._id!,
        };
        await releaseFundsDeliveredItem(
            await idConverter(cartProductId),
            req.user._id
        );
        await releaseRewardsForDeliveredItem(
            await idConverter(cartProductId),
            req.user._id
        );
        next()
    }
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Successfully update the order status",
        data: result,
    });
})

const getTransaction: RequestHandler = catchAsync(async (req, res) => {
    if (req.user.role !== 'Brand') {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated brand is required",
        );
    }

    const result = await OrderServices.getTransactionService(req)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Successfully earning status",
        data: result,
    });
})
// Helper function to release funds when item is delivered
const releaseFundsDeliveredItem = async function releaseFundsForDeliveredItem(
    cartProductId: Types.ObjectId,
    brandId: Types.ObjectId
) {
    try {
        // Find the order with this cart product
        const order = await Order.findOne({
            'items.cartProductId': cartProductId,
            'items.sellerStatus': SellerStatus.DELIVERED
        }).populate({
            path: 'cartId',
            populate: {
                path: 'products.productId'
            }
        });

        if (!order) {
            console.error("Order not found for delivered item");
            return;
        }

        const cart = order.cartId as any;
        const PLATFORM_FEE_RATE = 0.10;

        // Find the specific product in cart
        const cartProduct = cart.products.find(
            (p: any) => p._id.toString() === cartProductId.toString()
        );

        if (!cartProduct) {
            console.error("Cart product not found");
            return;
        }

        // Calculate amount for this specific product
        const productTotal = cartProduct.price * cartProduct.quantity;
        const platformFee = productTotal * PLATFORM_FEE_RATE;
        const brandAmount = productTotal - platformFee;

        console.log(`💰 Releasing $${brandAmount} for brand ${brandId}`);
        console.log(`   Product total: $${productTotal}`);
        console.log(`   Platform fee: $${platformFee}`);

        // Move from pending to available
        const updated = await Earning.findOneAndUpdate(
            { brandId },
            {
                $inc: {
                    pendingBalance: -brandAmount,
                    availableBalance: brandAmount,
                },
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Funds released! New available balance: $${updated?.availableBalance}`);

    } catch (error) {
        console.error("Error releasing funds:", error);
    }
}
async function releaseRewardsForDeliveredItem(
    cartProductId: Types.ObjectId,
    userId: Types.ObjectId
) {
    try {
        const order = await Order.findOne({
            'items.cartProductId': cartProductId,
            'items.sellerStatus': SellerStatus.DELIVERED
        }).populate({
            path: 'cartId',
            populate: 'products.productId'
        });

        if (!order) {
            console.error("Order not found for delivered item");
            return;
        }

        const cart = order.cartId as any;
        const REWARD_RATE = 0.10;

        const cartProduct = cart.products.find(
            (p: any) => p._id.toString() === cartProductId.toString()
        );

        if (!cartProduct) {
            console.error("Cart product not found");
            return;
        }

        const productTotal = cartProduct.price * cartProduct.quantity;
        const rewardAmount = productTotal * REWARD_RATE;

        console.log(`🎁 Releasing $${rewardAmount} rewards for user ${userId}`);

        // Move from pending to available
        await Reward.findOneAndUpdate(
            { userId },
            {
                $inc: {
                    pendingRewards: -rewardAmount,
                    availableRewards: rewardAmount,
                },
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Rewards released! User can now redeem.`);

    } catch (error) {
        console.error("Error releasing rewards:", error);
    }
}
const OrderController = {
    getOrders,
    updateStatus,
    getTransaction,
    releaseRewardsForDeliveredItem
}
export default OrderController