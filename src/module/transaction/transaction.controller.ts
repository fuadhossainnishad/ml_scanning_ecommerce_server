import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import httpStatus from "http-status";
import StripeUtils from "../../utility/stripe.utils";
import Brand from "../brand/brand.model";
import GenericService from "../../utility/genericService.helpers";
import { IBrand } from "../brand/brand.interface";
import sendResponse from "../../utility/sendResponse";
import { IWithdraw, WithdrawStatus } from "./transaction.interface";
import Withdraw from "./transaction.model";
import stripe from "../../app/config/stripe.config";

const CreateWithdraw: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== "Brand") {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authenticated brand is required");
    }

    const { email, _id, stripe_accounts_id } = req.user;
    const {
        amount,
        currency,
        country,
        account_holder_name,
        account_holder_type,
        routing_number,
        account_number
    } = req.body.data;

    const currencyCode = (currency || "usd").toLowerCase();

    // Step 1: Ensure Stripe account exists
    let stripeAccountId = stripe_accounts_id;
    if (!stripeAccountId || stripeAccountId === "") {
        stripeAccountId = await StripeUtils.CreateStripeAccount(email, country.toUpperCase(), req.ip!, "account_holder_name", "account_holder_name");
        await GenericService.updateResources<IBrand>(Brand, _id, { stripe_accounts_id: stripeAccountId });
    }
    console.log("stripeAccountId:", stripeAccountId)

    const balance = await stripe.balance.retrieve({}, { stripeAccount: stripeAccountId });
    console.log("balance:", balance)

    // Step 2: Check if account is ready for payouts
    const readiness = await StripeUtils.IsAccountReady(stripeAccountId);
    console.log("readiness:", readiness)

    if (!readiness.ready) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            `Account not ready for payout. Missing requirements: ${readiness.status.requirements_due.join(", ") || "Verification incomplete"}`
        );
    }
    console.log("stripeAccountId:", stripeAccountId)

    // Step 3: Validate earning and amount
    // const earning = await Earning.findOne({ brandId: _id });
    // if (!earning) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "There is no earning data to withdraw");
    // }

    // if (earning.available < amount) {
    //     throw new AppError(httpStatus.BAD_REQUEST, "Available balance is less than the withdraw amount");
    // }

    const bankToken = await StripeUtils.CreateBankToken({
        currency: currencyCode,
        country: country.toUpperCase(),
        account_holder_name: account_holder_name,
        account_holder_type: account_holder_type,
        routing_number: routing_number,
        account_number: account_number
    }
    )
    console.log("bankToken:", bankToken)

    // Step 4: Create external bank account
    const bankAccount = await StripeUtils.CreateExternalAccount(stripeAccountId, bankToken);
    console.log("bankAccount:", bankAccount)

    let withdrawStatus = WithdrawStatus.PENDING;

    try {
        await StripeUtils.CreatePayout(amount, currencyCode, stripeAccountId);
        withdrawStatus = WithdrawStatus.SUCCESS;
    } catch (err) {
        throw new AppError(httpStatus.BAD_REQUEST, `Payout failed & ${err}`);

    }

    // Step 6: Update earnings
    // await Earning.findOneAndUpdate(
    //     { brandId: _id },
    //     {
    //         $inc: { totalWithdraw: amount * 1, available: -amount * 1 },
    //         withdrawStatus,
    //         ready_for_withdraw: readiness.ready,
    //     },
    //     { new: true }
    // );

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
    console.log("withdrawData:", withdrawData)

    const result = await GenericService.insertResources<IWithdraw>(Withdraw, withdrawData);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: withdrawStatus === WithdrawStatus.SUCCESS ? "Withdraw successful" : "Withdraw failed",
        data: result,
    });
});

const WithdrawController = {
    CreateWithdraw,
};
export default WithdrawController;
