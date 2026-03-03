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
import NotificationService from "../notification/notification.service";
import { NotificationType } from "../notification/notification.interface";

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
        throw new AppError(httpStatus.BAD_REQUEST, "Authenticated brand is required");
    }

    const { cartProductId, sellerStatus } = req.body.data;

    if (!cartProductId || !sellerStatus) {
        throw new AppError(httpStatus.BAD_REQUEST, 'cartProductId and sellerStatus are required');
    }

    if (sellerStatus === SellerStatus.DELIVERED) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Order is already delivered. No further transitions allowed.');
    }

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

    const remindStatusMap: Record<SellerStatus, RemindeStatus> = {
        [SellerStatus.MARK_READY]: RemindeStatus.PROCESSING,
        [SellerStatus.MARK_FOR_SHIPPING]: RemindeStatus.READY_TO_SHIP,
        [SellerStatus.MARK_FOR_COMPLETE]: RemindeStatus.READY_TO_DELIVERED,
        [SellerStatus.DELIVERED]: RemindeStatus.DELIVERED,
    };

    const cartProductObjectId = await idConverter(cartProductId);
    const newRemindStatus = remindStatusMap[nextSellerStatus];

    const query = {
        items: {
            $elemMatch: {
                cartProductId: cartProductObjectId,
                sellerStatus,
            },
        },
    };
    console.log('[updateStatus] query:', JSON.stringify({
        cartProductId,
        sellerStatus,
        cartProductObjectId: cartProductObjectId.toString(),
    }, null, 2));

    // Also verify what's actually in the DB for this cartProductId
    const rawOrder = await Order.findOne({
        'items.cartProductId': cartProductObjectId
    });
    console.log('[updateStatus] raw order found:', JSON.stringify(rawOrder, null, 2));
    const findOrders = await GenericService.findAllResources<IOrder>(Order, query, [
        'items.cartProductId',
        'items.sellerStatus',
    ]);
    console.log('[updateStatus] findOrders result:', JSON.stringify(findOrders, null, 2));

    if (!findOrders || !findOrders.order || findOrders.meta.total === 0) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order item not found or status not matching');
    }

    const updateResult = await Order.updateMany(
        query,
        {
            $set: {
                'items.$[elem].sellerStatus': nextSellerStatus,
                'items.$[elem].remindStatus': newRemindStatus,
                ...(nextSellerStatus === SellerStatus.DELIVERED && {
                    'items.$[elem].deliveredAt': new Date(),
                }),
                updatedAt: new Date(),
            },
        },
        {
            arrayFilters: [
                {
                    'elem.cartProductId': cartProductObjectId,
                    'elem.sellerStatus': sellerStatus,
                },
            ],
        }
    );

    if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
        throw new AppError(httpStatus.NOT_FOUND, 'Failed to update order item status');
    }

    // DELIVERED → hand off to insertEarning which handles rewards + earnings + stripe + response
    if (nextSellerStatus === SellerStatus.DELIVERED) {
        req.body.data.orderUpdateData = {
            cartProductId: cartProductObjectId,
            brandId: req.user._id,
        };
        return next();
    }

    // All other transitions → notify and respond
    NotificationService.sendNotification({
        ownerId: req.user._id,
        receiverId: [req.user._id],
        type: NotificationType.SYSTEM,
        title: 'Order status updated',
        body: `Order has been moved to: ${nextSellerStatus}`,
        data: {
            userId: req.user._id.toString(),
            role: req.user.role,
            action: 'updated',
            time: new Date().toISOString(),
        },
        notifyAdmin: true,
    }).catch(err => console.error('Notification error:', err));

    const result = await OrderServices.getOrderService(req);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Order status updated successfully',
        data: result,
    });
});

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
// Shared helper to get product amount from cart
const getProductAmountFromCart = (
    cart: any,
    cartProductId: Types.ObjectId
): { price: number; quantity: number; productTotal: number } | null => {
    if (!cart || !Array.isArray(cart.products)) {
        console.error('[Order] Cart not populated or has no products array');
        return null;
    }

    const cartProduct = cart.products.find(
        (p: any) => p._id.toString() === cartProductId.toString()
    );

    if (!cartProduct) {
        console.error(`[Order] No cart product found matching cartProductId: ${cartProductId}`);
        console.error(`[Order] Available cart product _ids:`, cart.products.map((p: any) => p._id.toString()));
        return null;
    }

    const price = Number(cartProduct.price);
    const quantity = Number(cartProduct.quantity);

    if (isNaN(price) || isNaN(quantity)) {
        console.error(`[Order] Invalid price (${cartProduct.price}) or quantity (${cartProduct.quantity}) on cart product`);
        return null;
    }

    return { price, quantity, productTotal: price * quantity };
};

// const releaseFundsDeliveredItem = async (
//     cartProductId: Types.ObjectId,
//     brandId: Types.ObjectId
// ): Promise<void> => {
//     try {
//         const order = await Order.findOne({
//             'items.cartProductId': cartProductId,
//             'items.sellerStatus': SellerStatus.DELIVERED,
//         }).populate('cartId'); // cart.products has price + quantity

//         if (!order) {
//             console.error(`[Earnings] No order found for cartProductId: ${cartProductId}`);
//             return;
//         }

//         const cart = order.cartId as any;
//         const productData = getProductAmountFromCart(cart, cartProductId);
//         if (!productData) return;

//         const PLATFORM_FEE_RATE = 0.10;
//         const { productTotal } = productData;
//         const platformFee = productTotal * PLATFORM_FEE_RATE;
//         const brandAmount = productTotal - platformFee;

//         console.log(`[Earnings] productTotal=$${productTotal} fee=$${platformFee} releasing=$${brandAmount} to brand=${brandId}`);

//         const updated = await Earning.findOneAndUpdate(
//             { brandId },
//             {
//                 $inc: {
//                     pendingBalance: -brandAmount,
//                     availableBalance: brandAmount,
//                     totalEarnings: brandAmount,
//                 },
//             },
//             { upsert: true, new: true }
//         );

//         console.log(`[Earnings] ✅ Done. availableBalance=$${updated?.availableBalance} pendingBalance=$${updated?.pendingBalance}`);

//     } catch (error) {
//         console.error('[Earnings] Error releasing funds:', error);
//     }
// };

const releaseRewardsForDeliveredItem = async (
    cartProductId: Types.ObjectId,
    // userId: Types.ObjectId
): Promise<void> => {
    try {
        // userId here is brandId (req.user._id) — rewards belong to the BUYER
        // Get the actual buyerId from the order
        const order = await Order.findOne({
            'items.cartProductId': cartProductId,
            'items.sellerStatus': SellerStatus.DELIVERED,
        }).populate('cartId');

        if (!order) {
            console.error(`[Rewards] No order found for cartProductId: ${cartProductId}`);
            return;
        }

        const buyerId = order.userId; // ✅ buyer, not brand
        const cart = order.cartId as any;
        const productData = getProductAmountFromCart(cart, cartProductId);
        if (!productData) return;

        const REWARD_RATE = 0.10;
        const rewardAmount = productData.productTotal * REWARD_RATE;

        console.log(`[Rewards] Releasing $${rewardAmount} rewards for buyer=${buyerId}`);

        await Reward.findOneAndUpdate(
            { userId: buyerId },
            {
                $inc: {
                    pendingRewards: -rewardAmount,
                    availableRewards: rewardAmount,
                },
            },
            { upsert: true, new: true }
        );

        console.log(`[Rewards] ✅ Done. Buyer ${buyerId} rewards released.`);

    } catch (error) {
        console.error('[Rewards] Error releasing rewards:', error);
    }
};
// Helper function to release funds when item is delivered
// const releaseFundsDeliveredItem = async function releaseFundsForDeliveredItem(
//     cartProductId: Types.ObjectId,
//     brandId: Types.ObjectId
// ) {
//     try {

//         console.log("cartProductId:", cartProductId)
//         console.log("brandId:", brandId)

//         // Find the order with this cart product        
//         const order = await Order.findOne({
//             'items.cartProductId': cartProductId,
//             'items.sellerStatus': SellerStatus.DELIVERED
//         }).populate({
//             path: 'cartId',
//             // populate: {
//             //     path: 'products.productId'
//             // }
//         });

//         if (!order) {
//             console.error("Order not found for delivered item");
//             return;
//         }

//         console.log("releaseFundsDeliveredItem:", order)

//         const cart = order.cartId as any;
//         if (!cart || !Array.isArray(cart.products)) {
//             console.error(`[Earnings] Cart not populated or has no products`);
//             return;
//         }
//         const orderItem = order.items.find(
//             (item: any) => item.cartProductId.toString() === cartProductId.toString()
//         );
//         if (!orderItem) {
//             console.error(`[Earnings] Order item not found for cartProductId: ${cartProductId}`);
//             return;
//         }
//         const PLATFORM_FEE_RATE = 0.10;

//         // Find the specific product in cart
//         // const cartProduct = cart.products.find(
//         //     (p: any) => p._id.toString() === cartProductId.toString()
//         // );

//         // if (!cartProduct) {
//         //     console.error("Cart product not found");
//         //     return;
//         // }

//         // Calculate amount for this specific product
//         // const productTotal = cartProduct.price * cartProduct.quantity;
//         const productTotal = (orderItem as any).price * (orderItem as any).quantity;
//         const platformFee = productTotal * PLATFORM_FEE_RATE;
//         const brandAmount = productTotal - platformFee;

//         console.log(`[Earnings] Releasing $${brandAmount} for brand ${brandId} (product total: $${productTotal}, fee: $${platformFee})`);

//         console.log(`💰 Releasing $${brandAmount} for brand ${brandId}`);
//         console.log(`   Product total: $${productTotal}`);
//         console.log(`   Platform fee: $${platformFee}`);

//         // Move from pending to available
//         const updated = await Earning.findOneAndUpdate(
//             { brandId },
//             {
//                 $inc: {
//                     pendingBalance: -brandAmount,
//                     availableBalance: brandAmount,
//                     totalEarnings: brandAmount,
//                 },
//             },
//             { upsert: true, new: true }
//         );
//         console.log(`✅ Funds released! New available updated: $${updated}`);

//         console.log(`✅ Funds released! New available balance: $${updated?.availableBalance}`);

//     } catch (error) {
//         console.error("Error releasing funds:", error);
//     }
// }
// async function releaseRewardsForDeliveredItem(
//     cartProductId: Types.ObjectId,
//     userId: Types.ObjectId
// ) {
//     try {
//         const order = await Order.findOne({
//             'items.cartProductId': cartProductId,
//             'items.sellerStatus': SellerStatus.DELIVERED
//         }).populate({
//             path: 'cartId',
//             populate: 'products.productId'
//         });

//         if (!order) {
//             console.error("Order not found for delivered item");
//             return;
//         }

//         const cart = order.cartId as any;
//         const REWARD_RATE = 0.10;

//         const cartProduct = cart.products.find(
//             (p: any) => p._id.toString() === cartProductId.toString()
//         );

//         if (!cartProduct) {
//             console.error("Cart product not found");
//             return;
//         }

//         const productTotal = cartProduct.price * cartProduct.quantity;
//         const rewardAmount = productTotal * REWARD_RATE;

//         console.log(`🎁 Releasing $${rewardAmount} rewards for user ${userId}`);

//         // Move from pending to available
//         await Reward.findOneAndUpdate(
//             { userId },
//             {
//                 $inc: {
//                     pendingRewards: -rewardAmount,
//                     availableRewards: rewardAmount,
//                 },
//             },
//             { upsert: true, new: true }
//         );

//         console.log(`✅ Rewards released! User can now redeem.`);

//     } catch (error) {
//         console.error("Error releasing rewards:", error);
//     }
// }
const OrderController = {
    getOrders,
    updateStatus,
    getTransaction,
    releaseRewardsForDeliveredItem
}
export default OrderController