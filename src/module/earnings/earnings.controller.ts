import { RequestHandler, NextFunction } from "express"
import catchAsync from "../../utility/catchAsync"
import httpStatus from 'http-status';
import AppError from "../../app/error/AppError";
import Earning from "./earnings.model";
import { SellerStatus } from "../order/order.interface";
import Order from "../order/order.model";
import sendResponse from "../../utility/sendResponse";
import { PipelineStage } from "mongoose";
import StripeServices from "../stripe/stripe.service";


interface MonthlyEarnings {
    month: string;
    earnings: number;
}

const insertEarning: RequestHandler = catchAsync(async (req, res, next: NextFunction) => { // Added 'any' for res to avoid strict typing issues if needed

    if (!req.body.data.orderUpdateData) {
        console.warn("No orderUpdateData found; skipping earnings update");
        return next();
    }

    const { stripe_accounts_id } = req.user
    const { orderUpdateData } = req.body.data;
    const { updatedOrders, brandId } = orderUpdateData;

    console.log("orderUpdateData:", orderUpdateData);

    if (!updatedOrders || !updatedOrders.data || updatedOrders.data.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Invalid order data for earnings update");
    }

    let deliveredAmount = 0
    for (const item of updatedOrders.data) {
        deliveredAmount += (item.discountPrice || 0) * (item.quantity || 0);
    }
    const totalDeliveredAmount = Math.round(Number(deliveredAmount * 90 / 100))
    const transfer = await StripeServices.createTransfer(totalDeliveredAmount, 'usd', stripe_accounts_id)

    if (!transfer) {
        throw new AppError(httpStatus.BAD_REQUEST, "Failed to add order earnings ");
    }

    const updatedEarnings = await Earning.findOneAndUpdate(
        { brandId },
        {
            $inc: {
                totalEarnings: deliveredAmount,
                available: deliveredAmount,
            },
            $set: {
                updatedAt: new Date(),
            },
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
        }
    );

    if (!updatedEarnings) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update earnings");
    }

    console.log(`Added $${deliveredAmount} to brand ${brandId} earnings. New total: $${updatedEarnings.totalEarnings}`);
    console.log("updatedEarnings", updatedEarnings);
    next()
});

const getMonthlyEarnings: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== "Brand") {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authenticated brand is required");
    }

    const yearParam = req.query.year;
    const yearStr = Array.isArray(yearParam) ? (yearParam[0] as string) : (yearParam as string);
    const currentYearStr = yearStr || new Date().getFullYear().toString();
    const currentYearNum = parseInt(currentYearStr, 10);
    const brandId = req.user._id;

    const pipeline: PipelineStage[] = [
        {
            $match: {
                "items.sellerStatus": SellerStatus.DELIVERED
            }
        },
        // 2. Unwind items
        { $unwind: "$items" },
        {
            $match: {
                "items.sellerStatus": SellerStatus.DELIVERED
            }
        },
        {
            $lookup: {
                from: "carts", // Adjust if your carts collection name differs
                let: { cartId: "$cartId", cartProductId: "$items.cartProductId" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$cartId"] } } },
                    { $unwind: "$products" },
                    { $match: { $expr: { $eq: ["$products._id", "$$cartProductId"] } } },
                    { $project: { quantity: "$products.quantity", productId: "$products.productId" } }
                ],
                as: "cartProduct"
            }
        },
        { $unwind: "$cartProduct" },
        {
            $lookup: {
                from: "products",
                localField: "cartProduct.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $match: {
                "product.brandId": brandId,
                $expr: {
                    $eq: [
                        { $year: { $ifNull: ["$items.deliveredAt", "$updatedAt"] } },
                        currentYearNum
                    ]
                }
            }
        },
        {
            $project: {
                earnings: {
                    $multiply: [
                        { $ifNull: ["$product.discountPrice", "$product.price"] },
                        "$cartProduct.quantity"
                    ]
                },
                month: {
                    $month: { $ifNull: ["$items.deliveredAt", "$updatedAt"] }
                },
                year: {
                    $year: { $ifNull: ["$items.deliveredAt", "$updatedAt"] }
                }
            }
        },
        {
            $group: {
                _id: {
                    month: "$month",
                    year: "$year"
                },
                totalEarnings: { $sum: "$earnings" }
            }
        },
        {
            $project: {
                _id: 0,
                month: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                            { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                            { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                            { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                            { case: { $eq: ["$_id.month", 5] }, then: "May" },
                            { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                            { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                            { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                            { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                            { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                            { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                            { case: { $eq: ["$_id.month", 12] }, then: "Dec" }
                        ],
                        default: "Unknown"
                    }
                },
                earnings: "$totalEarnings"
            }
        },
        {
            $addFields: {
                monthNum: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$month", "Jan"] }, then: 1 },
                            { case: { $eq: ["$month", "Feb"] }, then: 2 },
                            { case: { $eq: ["$month", "Mar"] }, then: 3 },
                            { case: { $eq: ["$month", "Apr"] }, then: 4 },
                            { case: { $eq: ["$month", "May"] }, then: 5 },
                            { case: { $eq: ["$month", "Jun"] }, then: 6 },
                            { case: { $eq: ["$month", "Jul"] }, then: 7 },
                            { case: { $eq: ["$month", "Aug"] }, then: 8 },
                            { case: { $eq: ["$month", "Sep"] }, then: 9 },
                            { case: { $eq: ["$month", "Oct"] }, then: 10 },
                            { case: { $eq: ["$month", "Nov"] }, then: 11 },
                            { case: { $eq: ["$month", "Dec"] }, then: 12 }
                        ],
                        default: 0
                    }
                }
            }
        },
        { $sort: { monthNum: 1 } },
        { $project: { monthNum: 0 } }
    ];

    const monthlyData: MonthlyEarnings[] = await Order.aggregate(pipeline);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const filledData: MonthlyEarnings[] = months.map((month) => {
        const found = monthlyData.find((m) => m.month === month);
        return {
            month,
            earnings: found ? found.earnings : 0,
        };
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: `Monthly earnings for ${currentYearStr}`,
        data: filledData,
    });
});

const getEarningsSummary: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== "Brand") {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authenticated brand is required");
    }

    const brandId = req.user._id;

    // Fetch the brand's earning record
    const earning = await Earning.findOne({ brandId }).lean();
    // if (!earning) {
    //     throw new AppError(httpStatus.NOT_FOUND, "No earnings record found for this brand");
    // }

    // Compute current month earning
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Aggregation pipeline for current month (similar lookups, sum earnings)
    const monthlyPipeline: PipelineStage[] = [
        // 1. Match orders with at least one DELIVERED item
        {
            $match: {
                "items.sellerStatus": SellerStatus.DELIVERED
            }
        },
        // 2. Unwind items
        { $unwind: "$items" },
        // 3. Match DELIVERED items
        {
            $match: {
                "items.sellerStatus": SellerStatus.DELIVERED
            }
        },
        // 4. Lookup specific cart product via pipeline to get quantity and productId
        {
            $lookup: {
                from: "carts",
                let: { cartId: "$cartId", cartProductId: "$items.cartProductId" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$cartId"] } } },
                    { $unwind: "$products" },
                    { $match: { $expr: { $eq: ["$products._id", "$$cartProductId"] } } },
                    { $project: { quantity: "$products.quantity", productId: "$products.productId" } }
                ],
                as: "cartProduct"
            }
        },
        // 5. Unwind cartProduct
        { $unwind: "$cartProduct" },
        // 6. Lookup product
        {
            $lookup: {
                from: "products",
                localField: "cartProduct.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        // 7. Unwind product
        { $unwind: "$product" },
        // 8. Match by brandId and current month/year (fallback date)
        {
            $match: {
                "product.brandId": brandId,
                $expr: {
                    $and: [
                        {
                            $eq: [
                                { $year: { $ifNull: ["$items.deliveredAt", "$updatedAt"] } },
                                currentYear
                            ]
                        },
                        {
                            $eq: [
                                { $month: { $ifNull: ["$items.deliveredAt", "$updatedAt"] } },
                                currentMonth
                            ]
                        }
                    ]
                }
            }
        },
        // 9. Project earnings
        {
            $project: {
                earnings: {
                    $multiply: [
                        { $ifNull: ["$product.discountPrice", "$product.price"] },
                        "$cartProduct.quantity"
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                monthlyEarning: { $sum: "$earnings" }
            }
        }
    ];

    const monthlyResult = await Order.aggregate(monthlyPipeline);
    const monthlyEarning = monthlyResult.length > 0 ? monthlyResult[0].monthlyEarning : 0;
    const available = (earning?.totalEarnings || 0) - (earning?.totalWithdraw || 0)

    const summary = {
        totalEarning: earning?.totalEarnings || 0,
        monthlyEarning,
        totalPending: earning?.withdrawPending || 0,
        available: available || 0,
    };

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Earnings summary retrieved successfully",
        data: summary,
    });
});

const EarningsController = {
    insertEarning,
    getMonthlyEarnings,
    getEarningsSummary
}
export default EarningsController