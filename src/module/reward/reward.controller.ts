import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import Reward from "./reward.model";
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import GenericService from "../../utility/genericService.helpers";
import { IReward } from "./reward.interface";
import sendResponse from "../../utility/sendResponse";

const insertReward: RequestHandler = catchAsync(async (req, res, next) => {
    const orderUpdateData = req.body.data?.orderUpdateData;
    if (!orderUpdateData) return next();

    const { updatedOrders, userId } = orderUpdateData;
    if (!updatedOrders?.data?.length) return next();

    let totalAmount = 0;
    for (const item of updatedOrders.data) {
        totalAmount += (item.discountPrice || 0) * (item.quantity || 0);
    }

    await Reward.findOneAndUpdate(
        { userId: userId },
        {
            $inc: { totalSpent: totalAmount },
            $set: { updatedAt: new Date() },
        },
        { upsert: true, new: true, runValidators: true }
    );


    console.log(`Inserted/Updated reward for user ${userId}: $${totalAmount}`);
    next();
});

const getReward: RequestHandler = catchAsync(async (req, res) => {

    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
            ""
        );
    }
    const query = {
        userId: req.user._id,
        ...req.query
    }
    const result = await GenericService.findAllResources<IReward>(Reward, query, [])

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "successfully retrieve reward data",
        data: result,
    });
});

const RewardController = {
    insertReward,
    getReward
};
export default RewardController;
