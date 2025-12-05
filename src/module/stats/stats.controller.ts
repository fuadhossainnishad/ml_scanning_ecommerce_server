import { RequestHandler } from "express"
import catchAsync from "../../utility/catchAsync"
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import sendResponse from "../../utility/sendResponse";
import Brand from '../brand/brand.model';
import { IBrand } from "../brand/brand.interface";
import StatsServices from "./stats.services";
import Product from '../product/product.model';
import Order from "../order/order.model";
import { PipelineStage, Types } from "mongoose";
import Earning from "../earnings/earnings.model";
import Cart from "../cart/cart.model";
import { idConverter } from "../../utility/idConverter";
import Post from "../post/post.model";

interface MonthlyOrders {
    month: string; // e.g., "Jan"
    orders: number; // Total quantity of products ordered
}

interface BrandStats {
    totalOrders: number;
    totalSales: number;
    totalReviews: number;
    totalProducts: number
}

const scanning: RequestHandler = catchAsync(async (req, res) => {
    // if (req.body.scan.length < 1) {
    //     throw new AppError(httpStatus.NOT_ACCEPTABLE, "No scanning image come from your scanner");
    // }

    const { scan } = req.body.data


    const response = await StatsServices.scanningServices(scan)



    if (response.data.length === 0) {
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: "No matching found",
            data: [],
        });
    }

    const scanResults = response.data.results || [];

    if (scanResults.length === 0) {
        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "No matching products found",
            data: [],
        });
    }

    // Convert product IDs using idConverter
    const convertedIds = await Promise.all(
        scanResults.map(async (item: any) => {
            try {
                const converted = await idConverter(item.metadata?.product_id);
                return converted
            } catch (err) {
                console.error("Error converting product ID:", item.metadata?.product_id, err);
                return null;
            }
        })
    );

    // Remove nulls and duplicates
    const productIds = Array.from(new Set(convertedIds.filter(Boolean)));

    if (productIds.length === 0) {
        return sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "No valid product IDs found",
            data: [],
        });
    }

    console.log("🟢 Extracted product IDs:", productIds);

    // Query MongoDB for matching products
    const matchedProducts = await Product.find({
        _id: { $in: productIds },
        isDeleted: { $ne: true },
    }).lean();

    console.log("matchedProducts:", matchedProducts);

    return sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Successfully found matching products",
        data: matchedProducts,
    });
});

const appFirstStats: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, "Authenticated user is required");
    }

    const result = await StatsServices.fetchAggregationTwo<IBrand>(Brand, ["brandName", "brandLogo", "theme"], req.query)
    console.log("appFirstStats:", result)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "successfully retrieve brandlist",
        data: result,
    });
})

const appFirstStatsTwo: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, "Authenticated user is required");
    }

    // const query = {
    //     ...req.query,
    // }

    const result = await StatsServices.fetchAggregation<IBrand>(Brand, ["brandName", "brandLogo", "theme"], req.query)
    console.log("appFirstStats:", result)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "successfully retrieve brandlist",
        data: result,
    });
})

const getRelatedBrands: RequestHandler = async (req, res) => {
    const { brandId } = req.params; // Get the current brand's ID from params

    // Fetch the products of the current brand
    const products = await Product.find({ brandId });

    if (!products || products.length === 0) {
        return res.status(404).json({ message: "No products found for this brand" });
    }

    // Create a list of product categories or tags from the products
    const categories = products.map(product => product.category);

    // Find other brands that have products in the same categories or with similar tags (excluding the current brand)
    const relatedBrands = await Brand.aggregate([
        {
            $lookup: {
                from: 'products',  // Join with the products collection
                localField: '_id',
                foreignField: 'brandId',
                as: 'products'
            }
        },
        {
            $unwind: '$products'  // Flatten the products array
        },
        {
            $match: {
                // Match brands with products that have the same category or tags
                $or: [
                    { 'products.category': { $in: categories } },  // Match categories
                ],
                _id: { $ne: brandId },  // Exclude the current brand
                'products.isDeleted': false  // Ensure we exclude deleted products
            }
        },
        {
            $group: {
                _id: '$brandName',  // Group by brand name
                relatedBrandId: { $first: '$_id' },  // Get the brand ID
                products: { $push: '$products.name' }  // Optionally include the product names
            }
        },
        {
            $limit: 5  // Limit to top 5 related brands
        }
    ]);

    console.log("relatedBrands:", relatedBrands)

    return res.json({
        success: true,
        message: "Successfully retrieved related brands",
        data: relatedBrands,
    });
};

const getMonthlyProductOrders: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== "Brand") {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authenticated brand is required");
    }

    // Handle req.query.year properly to avoid type errors
    const yearParam = req.query.year;
    const yearStr = Array.isArray(yearParam) ? (yearParam[0] as string) : (yearParam as string);
    const currentYearStr = yearStr || new Date().getFullYear().toString();
    const currentYearNum = parseInt(currentYearStr, 10);
    const brandId = req.user._id;

    // MongoDB Aggregation Pipeline to sum product order quantities by month
    // Counts all placed orders (not just delivered), using order.createdAt for month/year
    // Looks up cart products for quantity and products for brandId match
    const pipeline: PipelineStage[] = [
        // 1. Match all orders (no status filter for placed orders)
        { $match: {} },
        // 2. Unwind items to process each ordered item
        { $unwind: "$items" },
        // 3. Lookup specific cart product via pipeline to get quantity and productId
        {
            $lookup: {
                from: "carts",
                let: { cartId: "$cartId", cartProductId: "$items.cartProductId" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$cartId"] } } },
                    { $unwind: "$products" },
                    { $match: { $expr: { $eq: ["$products._id", "$$cartProductId"] } } },
                    { $project: { quantity: "$products.quantity", productId: "$products.productId", isDeleted: "$products.isDeleted" } }
                ],
                as: "cartProduct"
            }
        },
        // 4. Unwind cartProduct (skip if no match or deleted)
        { $unwind: { path: "$cartProduct", preserveNullAndEmptyArrays: false } },
        // 5. Lookup product to get brandId
        {
            $lookup: {
                from: "products",
                localField: "cartProduct.productId",
                foreignField: "_id",
                as: "product"
            }
        },
        // 6. Unwind product
        { $unwind: "$product" },
        // 7. Match by brandId and year (using order.createdAt)
        {
            $match: {
                "product.brandId": brandId,
                "cartProduct.isDeleted": { $ne: true }, // Exclude deleted cart items
                $expr: {
                    $eq: [
                        { $year: "$createdAt" },
                        currentYearNum
                    ]
                }
            }
        },
        // 8. Project quantity and date fields
        {
            $project: {
                quantity: "$cartProduct.quantity",
                month: { $month: "$createdAt" },
                year: { $year: "$createdAt" }
            }
        },
        // 9. Group by month/year
        {
            $group: {
                _id: {
                    month: "$month",
                    year: "$year"
                },
                totalOrders: { $sum: "$quantity" }
            }
        },
        // 10. Project month name
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
                orders: "$totalOrders"
            }
        },
        // 11. Add monthNum for sorting
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
        // 12. Sort by month
        { $sort: { monthNum: 1 } },
        // 13. Remove monthNum
        { $project: { monthNum: 0 } }
    ];

    const monthlyData: MonthlyOrders[] = await Order.aggregate(pipeline);

    // Fill missing months with 0 orders
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const filledData: MonthlyOrders[] = months.map((month) => {
        const found = monthlyData.find((m) => m.month === month);
        return {
            month,
            orders: found ? found.orders : 0,
        };
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: `Monthly product orders for ${currentYearStr}`,
        data: filledData,
    });
});

const getBrandStats: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== "Brand") {
        throw new AppError(httpStatus.UNAUTHORIZED, "Authenticated brand is required");
    }

    console.log("getBrandStats", req.user);


    const { _id } = req.user
    console.log("brandId", _id);


    const productPipeline: PipelineStage[] = [
        { $match: { brandId: _id } },
        {
            $lookup: {
                from: "reviews",
                let: { productId: "$_id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$productId", "$$productId"] }, isDeleted: false } }
                ],
                as: "reviewsData"
            }
        },
        { $addFields: { numReviews: { $size: "$reviewsData" } } },
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalReviews: { $sum: "$numReviews" },
                productIds: { $addToSet: "$_id" }
            }
        }
    ];
    const productResult = await Product.aggregate(productPipeline).exec()
    console.log("productResult:", productResult)

    const { totalProducts = 0, totalReviews = 0, productIds = [] } = productResult[0] || {};

    let totalOrders = 0;
    if (productIds.length > 0) {
        const cartPipeline: PipelineStage[] = [
            { $match: { isDeleted: true } },
            { $unwind: "$products" },
            { $match: { "products.productId": { $in: productIds }, "products.isDeleted": false } },
            {
                $group: {
                    _id: null,
                    cartProductIds: { $addToSet: "$products._id" }
                }
            }
        ];
        const cartResult = await Cart.aggregate(cartPipeline).exec()
        const cartProductIds: Types.ObjectId[] = cartResult[0]?.cartProductIds || [];

        if (cartProductIds.length > 0) {
            totalOrders = await Order.countDocuments({
                isDeleted: false,
                "items": { $elemMatch: { cartProductId: { $in: cartProductIds } } }
            });
        }
    }

    const earning = await Earning.findOne({ brandId: _id }).lean();
    const totalSales = earning ? earning.totalEarnings || 0 : 0;

    const stats: BrandStats = {
        totalOrders,
        totalSales,
        totalReviews,
        totalProducts,
    };

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Brand statistics retrieved successfully",
        data: stats,
    });
});

const getCategoryList: RequestHandler = catchAsync(async (req, res) => {
    const { id } = req.params
    const result = await Product.distinct("category", { brandId: await idConverter(id), isDeleted: false })
    console.log("Category:", result)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category list retrieved successfully",
        data: result,
    });
})

const postFilterList: RequestHandler = catchAsync(async (req, res) => {
    const result = await Post.distinct("tags", { isDeleted: false })
    console.log("Tags:", result)

    const hardList = ['User', 'Brand', 'New']

    const list = Array.from(new Set([...hardList, ...result]))
    console.log("all tags:", list)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Post Filter list retrieved successfully",
        data: list,
    });
})

const brandOfTheWeek: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, "Authenticated user is required");
    }

    let result = await StatsServices.brandOfTheWeekService();

    if (!result || !result.brandId) {
        const fallbackBrand = await Brand.findOne().select(
            "brandName theme brandLogo"
        );

        result = {
            brandId: fallbackBrand?._id,
            brandName: fallbackBrand?.brandName,
            theme: fallbackBrand?.theme,
            brandLogo: fallbackBrand?.brandLogo,
        };
    }
    console.log("brandOfTheWeek:", result)
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "successfully retrieve brand of the week",
        data: result,
    });
})

const StatsController = {
    scanning,
    appFirstStats,
    appFirstStatsTwo,
    getRelatedBrands,
    getMonthlyProductOrders,
    getBrandStats,
    getCategoryList,
    postFilterList,
    brandOfTheWeek
}
export default StatsController