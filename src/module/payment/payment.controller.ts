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

    if (!findCart || !findCart.products || findCart.products.length === 0) {
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

    const result = await StripeServices.paymentWithSaveCardservice(req.body.data);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: result.status === "succeeded"
            ? "Payment completed successfully"
            : "Payment is processing",
        data: result,
    });
});


const webhooks: RequestHandler = catchAsync(async (req, res) => {
    const sig = req.headers["stripe-signature"]!

    if (!sig || Array.isArray(sig)) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Invalid Stripe signature header",
            ""
        );
    }
    const rawbody = req.body

    const { paymentIntent } = await StripeServices.handleStripeWebhook({ sig: sig, rawbody: rawbody })

    const { metadata, id, amount, currency, status, payment_method } = paymentIntent;
    let paymentMethodId
    if (typeof payment_method === "string") {
        paymentMethodId = payment_method;
    } else if (payment_method && typeof payment_method === "object" && "id" in payment_method) {
        paymentMethodId = payment_method.id;
    }

    const paymentPayload: IPayment = {
        userId: await idConverter(metadata.userId),
        orderId: await idConverter(metadata.orderId),
        stripeCustomerId: metadata.stripe_customer_id,
        paymentIntentId: id,
        amount: amount / 100,
        currency,
        paymentStatus: status,
        paymentMethod: paymentMethodId!,
        metadata,
        payStatus: status === "succeeded",
        isDeleted: false,
    };

    const insertPayment = await GenericService.insertResources<IPayment>(Payment, paymentPayload)

    if (insertPayment) {
        const updateCart = await GenericService.updateResources<ICart>(
            Cart,
            await idConverter(metadata.cartId),
            {
                isDeleted: true,
                updatedAt: new Date
            }
        )

        if (!updateCart) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "There is a an issue with cart",
                ""
            );
        }

        const updateOrder = await GenericService.updateResources<IOrder>(
            Order,
            await idConverter(metadata.orderId),
            {
                paymentStatus: PaymentStatus.PAID,
                updatedAt: new Date
            }
        )

        if (!updateOrder) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                "There is a an issue with order payment",
                ""
            );
        }
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "payment successfully complete",
        data: paymentIntent,
    });
})

const PaymentController = {
    paymentWithSaveCard,
    webhooks
}
export default PaymentController
