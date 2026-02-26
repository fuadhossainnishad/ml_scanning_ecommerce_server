import { RequestHandler } from "express"
import catchAsync from "../../utility/catchAsync"
import sendResponse from '../../utility/sendResponse';
import httpStatus from 'http-status';
import AppError from "../../app/error/AppError";
import StripeServices from "../stripe/stripe.service";
import CartServices from "../cart/cart.services";
import { IOrder, OrderStatus, PaymentStatus, RemindeStatus, SellerStatus } from "../order/order.interface";
import GenericService from "../../utility/genericService.helpers";
import Order from "../order/order.model";
import Payment from "./payment.model";
import { IPayment } from "./payment.interface";
import { idConverter } from "../../utility/idConverter";
import { ICart, IProductResponse } from "../cart/cart.interface";
import Cart from "../cart/cart.model";
import stripe from '../../app/config/stripe.config';
import config from "../../app/config";
import StripeUtils from "../../utility/stripe.utils";
import { Types } from "mongoose";
import Reward from "../reward/reward.model";

const paymentWithSaveCard: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
            ""
        );
    }

    const findCart = await CartServices.getCartService(req);
    console.log("cart details:", findCart);

    if (!findCart) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "There are no products in the cart to order",
            ""
        );
    }

    if (Number(findCart.total) !== Number(req.body.data.amount)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Amount mismatch",
            ""
        );
    }

    const orderItems = findCart.products.map((prod: IProductResponse) => ({
        cartProductId: prod._id!,
        sellerStatus: SellerStatus.MARK_READY,
        remindStatus: RemindeStatus.PROCESSING,
    }));

    const orderData: IOrder = {
        userId: req.user._id,
        userType: req.user.role,
        cartId: findCart._id!,
        address: req.body.data.address,
        items: orderItems,
        orderStatus: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PENDING,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const order = await GenericService.insertResources<IOrder>(Order, orderData);

    req.body.data.userId = req.user._id.toString();
    req.body.data.stripe_customer_id = req.user.stripe_customer_id;
    req.body.data.orderId = order.order._id.toString();
    req.body.data.cartId = order.order.cartId.toString();

    const result = await StripeServices.createPaymentIntentService(req.body.data);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Payment is processing",
        data: result,
    });
});

const paymentIntent: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
            ""
        );
    }

    console.log("payment intent data:", req.body.data)

    const existCart = await Cart.find({ userId: req.user._id, isDeleted: false })
    console.log("existCart details:", existCart);
    console.log("userId:", req.user._id)

    const findCart = await CartServices.getCartService(req);
    console.log("cart details:", findCart);

    if (!findCart) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "There are no products in the cart to order",
            ""
        );
    }

    if (Number(findCart.total) !== Number(req.body.data.amount)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Amount mismatch",
            ""
        );
    }

    const orderItems = findCart.products.map((prod: IProductResponse) => ({
        cartProductId: prod._id!,
        sellerStatus: SellerStatus.MARK_READY,
        remindStatus: RemindeStatus.PROCESSING,
    }));

    const orderData: IOrder = {
        userId: req.user._id,
        userType: req.user.role,
        cartId: findCart._id!,
        address: req.body.data.address,
        items: orderItems,
        orderStatus: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PENDING,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const order = await GenericService.insertResources<IOrder>(Order, orderData);

    console.log("order:", order.order)
    const customerId = await StripeUtils.checkCustomerId(req.user.stripe_customer_id, req.user.email);
    if (!customerId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Stripe customer ID is required",
            ""
        );
    }
    req.body.data.userId = req.user._id.toString();
    req.body.data.stripe_customer_id = customerId;
    req.body.data.orderId = order.order._id.toString();
    req.body.data.cartId = order.order.cartId.toString();
    console.log("data:", req.body.data)
    const metadata = {
        address: JSON.stringify(req.body.data.address),
        userId: req.user._id.toString(),
        stripe_customer_id: customerId,
        orderId: order.order._id.toString(),
        cartId: order.order.cartId.toString()
    }


    // const result = await StripeServices.createPaymentIntentService(req.body.data);

    const ephemeralKey = await StripeServices.createEphimeralKey(customerId);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(req.body.data.amount) * 100),
        currency: 'usd',
        customer: customerId,
        metadata,
        automatic_payment_methods: {
            enabled: true,
        },
    });

    console.log("paymentIntent:", paymentIntent.client_secret)
    console.log("ephemeralKey:", ephemeralKey)
    console.log("customerId:", customerId)
    console.log("publishableKey:", config.stripe.publishKey)


    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Payment is processing",
        data: {
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey,
            customer: customerId,
            publishableKey: config.stripe.publishKey!
        },
    });
});

const webhooks: RequestHandler = async (req, res) => {
    console.log("🔔 Webhook received");
    const sig = req.headers["stripe-signature"];
    console.log("webhook sig:", sig);

    if (!sig || Array.isArray(sig)) {
        console.error("❌ Invalid signature header");
        return res.status(400).send("Invalid Stripe signature header");
    }
    console.log("Headers:", req.headers);
    console.log("Signature Header:", req.headers["stripe-signature"]);
    console.log("Secret:", config.stripe.webHookSecret);

    try {
        const rawbody = Buffer.isBuffer(req.body) 
            ? req.body 
            : Buffer.from(JSON.stringify(req.body));

        console.log("Body type:", typeof req.body);
        console.log("Is Buffer:", Buffer.isBuffer(req.body));
        console.log("Body preview:", req.body?.toString?.().slice(0, 100));
        const { paymentIntent } = await StripeServices.handleStripeWebhook({
            sig: sig,
            rawbody: rawbody
        });

        console.log("paymentIntent:", paymentIntent);

        // Handle case where event is not payment_intent related
        if (!paymentIntent) {
            console.log("ℹ️ Event not related to payment_intent, acknowledging");
            return res.status(200).json({
                received: true,
                message: "Event acknowledged but not processed"
            });
        }

        // Now safe to destructure
        const { metadata, id, amount, currency, status, payment_method } = paymentIntent;

        // Validate metadata exists (test webhooks won't have our metadata)
        if (!metadata || !metadata.userId || !metadata.orderId || !metadata.cartId) {
            console.error("⚠️ Missing required metadata (likely test webhook):", metadata);
            return res.status(200).json({
                received: true,
                message: "Test webhook acknowledged"
            });
        }

        console.log("Processing payment with metadata:", metadata);

        let paymentMethodId;
        if (typeof payment_method === "string") {
            paymentMethodId = payment_method;
        } else if (payment_method && typeof payment_method === "object" && "id" in payment_method) {
            paymentMethodId = payment_method.id;
        }

        console.log("Creating payment record...");

        const paymentPayload: IPayment = {
            userId: await idConverter(metadata.userId),
            orderId: await idConverter(metadata.orderId),
            stripeCustomerId: metadata.stripe_customer_id,
            paymentIntentId: id,
            amount: amount / 100,
            currency,
            paymentStatus: "pending",
            paymentMethod: paymentMethodId || "unknown",
            metadata,
            payStatus: status === "succeeded",
            isDeleted: false,
        };

        const insertPayment = await GenericService.insertResources<IPayment>(
            Payment,
            paymentPayload
        );

        console.log("✅ Payment record created");

        if (insertPayment) {
            console.log("Updating cart...");
            const updateCart = await GenericService.updateResources<ICart>(
                Cart,
                await idConverter(metadata.cartId),
                {
                    isDeleted: true,
                    updatedAt: new Date()
                }
            );

            if (updateCart) {
                console.log("✅ Cart updated");
            } else {
                console.error("⚠️ Failed to update cart");
            }

            console.log("Updating order...");
            const updateOrder = await GenericService.updateResources<IOrder>(
                Order,
                await idConverter(metadata.orderId),
                {
                    paymentStatus: PaymentStatus.PAID,
                    orderStatus: OrderStatus.CONFIRM,
                    updatedAt: new Date()
                }
            );

            if (updateOrder) {
                console.log("✅ Order updated");
            } else {
                console.error("⚠️ Failed to update order");
            }
            await trackUserRewards(
                await idConverter(metadata.orderId),
                amount / 100,
                await idConverter(metadata.userId)
            );
            console.log("✅ Payment, cart, order, and rewards updated");

        }

        console.log("✅ Webhook processing completed");

        return res.status(200).json({
            received: true,
            message: "Payment successfully complete"
        });

    } catch (error: any) {
        console.error("❌ Webhook error:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        // Return 500 so Stripe retries
        return res.status(500).json({
            error: "Webhook processing failed",
            message: error.message
        });
    }
};

// const webhooks: RequestHandler = async (req, res) => {
//     const sig = req.headers["stripe-signature"]!
//     console.log("webhook sig:", sig)

//     if (!sig || Array.isArray(sig)) {
//         throw new AppError(
//             httpStatus.BAD_REQUEST,
//             "Invalid Stripe signature header",
//             ""
//         );
//     }
//     const rawbody = req.body

//     const { paymentIntent } = await StripeServices.handleStripeWebhook({ sig: sig, rawbody: rawbody })
//     console.log("paymentIntent:", paymentIntent)

//     const { metadata, id, amount, currency, status, payment_method } = paymentIntent;
//     let paymentMethodId
//     if (typeof payment_method === "string") {
//         paymentMethodId = payment_method;
//     } else if (payment_method && typeof payment_method === "object" && "id" in payment_method) {
//         paymentMethodId = payment_method.id;
//     }



//     const paymentPayload: IPayment = {
//         userId: await idConverter(metadata.userId),
//         orderId: await idConverter(metadata.orderId),
//         stripeCustomerId: metadata.stripe_customer_id,
//         paymentIntentId: id,
//         amount: amount / 100,
//         currency,
//         paymentStatus: status,
//         paymentMethod: paymentMethodId!,
//         metadata,
//         payStatus: status === "succeeded",
//         isDeleted: false,
//     };

//     const insertPayment = await GenericService.insertResources<IPayment>(Payment, paymentPayload)

//     if (insertPayment) {
//         const updateCart = await GenericService.updateResources<ICart>(
//             Cart,
//             await idConverter(metadata.cartId),
//             {
//                 isDeleted: true,
//                 updatedAt: new Date
//             }
//         )

//         if (!updateCart) {
//             throw new AppError(
//                 httpStatus.BAD_REQUEST,
//                 "There is a an issue with cart",
//                 ""
//             );
//         }

//         const updateOrder = await GenericService.updateResources<IOrder>(
//             Order,
//             await idConverter(metadata.orderId),
//             {
//                 paymentStatus: PaymentStatus.PAID,
//                 updatedAt: new Date
//             }
//         )

//         if (!updateOrder) {
//             throw new AppError(
//                 httpStatus.BAD_REQUEST,
//                 "There is a an issue with order payment",
//                 ""
//             );
//         }
//     }

//     sendResponse(res, {
//         success: true,
//         statusCode: httpStatus.CREATED,
//         message: "payment successfully complete",
//         data: paymentIntent,
//     });
// }

// payment.controller.ts
// const webhooks: RequestHandler = async (req, res) => {
//     console.log("🔔 Webhook received");
//     console.log("Headers:", req.headers);
//     console.log("Body type:", typeof req.body);

//     const sig = req.headers["stripe-signature"];
//     console.log("webhook sig:", sig);

//     if (!sig || Array.isArray(sig)) {
//         console.error("❌ Invalid signature header");
//         return res.status(400).send("Invalid Stripe signature header");
//     }

//     try {
//         console.log("Verifying webhook...");

//         // Get raw body
//         const rawBody = req.body;
//         console.log("Raw body buffer:", Buffer.isBuffer(rawBody));

//         // Verify webhook
//         const { paymentIntent } = await StripeServices.handleStripeWebhook({ 
//             sig: sig, 
//             rawbody: rawBody 
//         });

//         console.log("✅ Webhook verified successfully");
//         console.log("Payment Intent ID:", paymentIntent?.id);
//         console.log("Payment Intent Status:", paymentIntent?.status);
//         console.log("Metadata:", paymentIntent?.metadata);

//         const { metadata, id, amount, currency, status, payment_method } = paymentIntent;

//         // Validate metadata
//         if (!metadata || !metadata.userId || !metadata.orderId || !metadata.cartId) {
//             console.error("❌ Missing required metadata:", metadata);
//             return res.status(400).json({ 
//                 error: "Missing required metadata",
//                 metadata 
//             });
//         }

//         let paymentMethodId;
//         if (typeof payment_method === "string") {
//             paymentMethodId = payment_method;
//         } else if (payment_method && typeof payment_method === "object" && "id" in payment_method) {
//             paymentMethodId = payment_method.id;
//         }

//         console.log("Creating payment record...");

//         const paymentPayload: IPayment = {
//             userId: await idConverter(metadata.userId),
//             orderId: await idConverter(metadata.orderId),
//             stripeCustomerId: metadata.stripe_customer_id,
//             paymentIntentId: id,
//             amount: amount / 100,
//             currency,
//             paymentStatus: status,
//             paymentMethod: paymentMethodId || "unknown",
//             metadata,
//             payStatus: status === "succeeded",
//             isDeleted: false,
//         };

//         const insertPayment = await GenericService.insertResources<IPayment>(
//             Payment, 
//             paymentPayload
//         );

//         console.log("✅ Payment record created:", insertPayment);

//         if (insertPayment) {
//             console.log("Updating cart...");
//             const updateCart = await GenericService.updateResources<ICart>(
//                 Cart,
//                 await idConverter(metadata.cartId),
//                 {
//                     isDeleted: true,
//                     updatedAt: new Date()
//                 }
//             );

//             if (!updateCart) {
//                 console.error("⚠️ Failed to update cart");
//             } else {
//                 console.log("✅ Cart updated");
//             }

//             console.log("Updating order...");
//             const updateOrder = await GenericService.updateResources<IOrder>(
//                 Order,
//                 await idConverter(metadata.orderId),
//                 {
//                     paymentStatus: PaymentStatus.PAID,
//                     orderStatus: OrderStatus.CONFIRMED,
//                     updatedAt: new Date()
//                 }
//             );

//             if (!updateOrder) {
//                 console.error("⚠️ Failed to update order");
//             } else {
//                 console.log("✅ Order updated");
//             }
//         }

//         console.log("✅ Webhook processing completed");

//         // MUST return 200 to Stripe
//         return res.status(200).json({ 
//             received: true,
//             message: "Webhook processed successfully" 
//         });

//     } catch (error: any) {
//         console.error("❌ Webhook error:", error);
//         console.error("Error message:", error.message);
//         console.error("Error stack:", error.stack);

//         // Return 500 so Stripe retries
//         return res.status(500).json({ 
//             error: "Webhook processing failed",
//             message: error.message,
//             stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
//         });
//     }
// };
const test: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
            ""
        );
    }

    // Use correct field name: stripe_customer_id (top-level on user)
    const customerId = await StripeUtils.checkCustomerId(req.user.stripe_customer_id, req.user.email);
    if (!customerId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Stripe customer ID is required",
            ""
        );
    }

    const metadata = req.body.data.address

    console.log("data:", req.body.data)

    const ephemeralKey = await StripeServices.createEphimeralKey(customerId);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(req.body.data.amount) * 100),
        currency: 'usd',
        customer: customerId,
        metadata,
        automatic_payment_methods: {
            enabled: true,
        },
    });

    console.log("paymentIntent:", paymentIntent.client_secret)
    console.log("ephemeralKey:", ephemeralKey)
    console.log("customerId:", customerId)
    console.log("publishableKey:", config.stripe.publishKey)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Payment is processing",
        data: {
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey,
            customer: customerId,
            publishableKey: config.stripe.publishKey!
        },
    });
});

const payment: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
            ""
        );
    }

    const customerId = await StripeUtils.checkCustomerId(req.user.stripe_customer_id, req.user.email);
    if (!customerId) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Stripe customer ID is required",
            ""
        );
    }

    // const metadata = req.body.data.address

    console.log("data:", req.body.data)

    const ephemeralKey = await StripeServices.createEphimeralKey(customerId);


    const findCart = await CartServices.getCartService(req);
    // const findCart = await Cart.find({ userId: req.user._id, isDeleted: false })

    console.log("cart details:", findCart!);

    if (!findCart) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "There are no products in the cart to order",
            ""
        );
    }

    if (Number(findCart.total) !== Number(req.body.data.amount)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Amount mismatch",
            ""
        );
    }

    const orderItems = findCart.products.map((prod: IProductResponse) => ({
        cartProductId: prod._id!,
        sellerStatus: SellerStatus.MARK_READY,
        remindStatus: RemindeStatus.PROCESSING,
    }));

    const orderData: IOrder = {
        userId: req.user._id,
        userType: req.user.role,
        cartId: findCart._id!,
        address: req.body.data.address,
        items: orderItems,
        orderStatus: OrderStatus.PROCESSING,
        paymentStatus: PaymentStatus.PENDING,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const order = await GenericService.insertResources<IOrder>(Order, orderData);

    req.body.data.userId = req.user._id.toString();
    req.body.data.stripe_customer_id = req.user.stripe_customer_id;
    req.body.data.orderId = order.order._id.toString();
    req.body.data.cartId = order.order.cartId.toString();

    const metadata = {
        userId: req.body.data.userId,
        stripe_customer_id: req.body.data.stripe_customer_id,
        orderId: req.body.data.orderId,
        cartId: req.body.data.cartId
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(req.body.data.amount) * 100),
        currency: 'usd',
        customer: customerId,
        metadata,
        automatic_payment_methods: {
            enabled: true,
        },
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Payment is processing",
        data: {
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey,
            customer: customerId,
            publishableKey: config.stripe.publishKey!
        },
    });
});

// Helper to track user rewards when payment succeeds
async function trackUserRewards(orderId: Types.ObjectId, paymentAmount: number, userId: Types.ObjectId) {
    try {
        console.log("🎁 Tracking user rewards for order:", orderId);

        const REWARD_RATE = 0.10; // 10% rewards
        const rewardAmount = paymentAmount * REWARD_RATE;

        // Add to pending rewards
        await Reward.findOneAndUpdate(
            { userId },
            {
                $inc: {
                    totalSpent: paymentAmount,
                    pendingRewards: rewardAmount,
                    totalEarned: rewardAmount
                }
            },
            { upsert: true, new: true }
        );

        console.log(`✅ User ${userId} earned $${rewardAmount} in pending rewards`);

    } catch (error) {
        console.error("Error tracking user rewards:", error);
    }
}

const PaymentController = {
    paymentWithSaveCard,
    paymentIntent,
    webhooks,
    test,
    payment,
    trackUserRewards
}
export default PaymentController
