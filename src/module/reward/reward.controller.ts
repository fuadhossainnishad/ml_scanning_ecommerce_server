import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import Reward from "./reward.model";

const insertReward: RequestHandler = catchAsync(async (req, res, next) => {
    const orderUpdateData = req.body.data?.orderUpdateData;
    if (!orderUpdateData) return next();

    const { updatedOrders, brandId } = orderUpdateData;
    if (!updatedOrders?.data?.length) return next();

    let totalAmount = 0;
    for (const item of updatedOrders.data) {
        totalAmount += (item.discountPrice || 0) * (item.quantity || 0);
    }

    const reward = await Reward.findOneAndUpdate(
        { userId: brandId },
        {
            $inc: { totalSpent: totalAmount },
            $set: { updatedAt: new Date() },
        },
        { upsert: true, new: true, runValidators: true }
    );

    reward.reward = reward.totalSpent / 10;
    reward.remainReward = reward.reward - reward.spentReward;
    await reward.save();

    console.log(`Inserted/Updated reward for user ${brandId}: $${totalAmount}`);
    next();
});

const RewardController = { insertReward };
export default RewardController;
