import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import httpStatus from "http-status";
import StripeUtils from "../../utility/stripe.utils";
import Brand from "../brand/brand.model";
import GenericService from "../../utility/genericService.helpers";
import { IBrand } from "../brand/brand.interface";
import sendResponse from "../../utility/sendResponse";
import Earning from "../earnings/earnings.model";
import { IWithdraw, WithdrawStatus } from "./withdraw.interface";
import Withdraw from "./withdraw.model";

const CreateWithdraw: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== "Brand") {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authenticated brand is required");
    }

    const { email, _id, stripe_accounts_id } = req.user;
    const { amount, currency, bankToken } = req.body.data;

    const currencyCode = (currency || "usd").toLowerCase();

    // Step 1: Ensure Stripe account exists
    let stripeAccountId = stripe_accounts_id;
    if (!stripeAccountId || stripeAccountId === "") {
        stripeAccountId = await StripeUtils.CreateStripeAccount(email, currencyCode, req.ip!);
        await GenericService.updateResources<IBrand>(Brand, _id, { stripe_accounts_id: stripeAccountId });
    }

    // Step 2: Check if account is ready for payouts
    const readiness = await StripeUtils.IsAccountReady(stripeAccountId);
    if (!readiness.ready) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Account not ready for payout. Missing requirements: ${readiness.status.requirements_due.join(", ") || "Verification incomplete"}`
        );
    }

    // Step 3: Validate earning and amount
    const earning = await Earning.findOne({ brandId: _id });
    if (!earning) {
        throw new AppError(httpStatus.BAD_REQUEST, "There is no earning data to withdraw");
    }

    if (earning.available < amount) {
        throw new AppError(httpStatus.BAD_REQUEST, "Available balance is less than the withdraw amount");
    }

    // Step 4: Create external bank account
    const bankAccount = await StripeUtils.CreateExternalAccount(stripeAccountId, bankToken);

    let withdrawStatus = WithdrawStatus.PENDING;

    try {
        await StripeUtils.CreatePayout(amount, currencyCode, stripeAccountId);
        withdrawStatus = WithdrawStatus.SUCCESS;
    } catch (err) {
        withdrawStatus = WithdrawStatus.CANCEL;
        console.error("Stripe payout failed:", err);
    }

    // Step 6: Update earnings
    await Earning.findOneAndUpdate(
        { brandId: _id },
        {
            $inc: { totalWithdraw: amount * 1, available: -amount * 1 },
            withdrawStatus,
            ready_for_withdraw: readiness.ready,
        },
        { new: true }
    );

    // Step 7: Create withdraw record
    const withdrawData = {
        brandId: _id,
        bank_account_id: bankAccount.id,
        amount,
        withdrawStatus,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await GenericService.insertResources<IWithdraw>(Withdraw, withdrawData);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: withdrawStatus === WithdrawStatus.SUCCESS ? "Withdraw successful" : "Withdraw failed",
        data: result,
    });
});

const EarningsController = {
    CreateWithdraw,
};
export default EarningsController;
