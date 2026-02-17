import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import sendResponse from "../../utility/sendResponse";
import StripeServices from "../stripe/stripe.service";
import StripeUtils from "../../utility/stripe.utils";
import Admin from "../admin/admin.model";

// In your payment.controller.ts (add this)
const savePaymentMethod: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.BAD_REQUEST, "Authenticated user is required", "");
    }

    if (!req.params.id) {
        throw new AppError(httpStatus.BAD_REQUEST, "Payment method ID is required", "");
    }
    const data = {
        paymentMethodId: req.params.id,
        stripeCustomerId: req.user.stripe_customer_id
    }
    const result = await StripeServices.attachPaymentMethodService(data);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Payment method saved successfully",
        data: result,
    });
});
const getSavedPaymentMethods: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.BAD_REQUEST, "Authenticated user is required", "");
    }

    const result = await StripeServices.listPaymentMethodsService({
        stripeCustomerId: req.user.stripe_customer_id,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Saved payment methods retrieved",
        data: result,
    });
});

const setupIntent: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.BAD_REQUEST, "Authenticated user is required", "");
    }

    const stripe_customer_id = await StripeUtils.checkCustomerId(
        req.user.stripe_customer_id,
        req.user.email
    );

    if (stripe_customer_id !== req.user.stripe_customer_id) {
        await Admin.findByIdAndUpdate(req.user._id, { stripe_customer_id: stripe_customer_id });
        req.user.stripe_customer_id = stripe_customer_id
    }
    const result = await StripeServices.CreateSetupIntent(req.user.stripe_customer_id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Setup intent create successfully",
        data: result,
    });
});

const CardController = {
    savePaymentMethod,
    getSavedPaymentMethods,
    setupIntent,

}

export default CardController