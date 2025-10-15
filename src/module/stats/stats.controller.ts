import { RequestHandler } from "express"
import catchAsync from "../../utility/catchAsync"
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import sendResponse from "../../utility/sendResponse";
import Brand from '../brand/brand.model';
import { IBrand } from "../brand/brand.interface";
import StatsServices from "./stats.services";
import Product from "../product/product.model";

const appFirstStats: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'User') {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, "Authenticated user is required");
    }

    const result = await StatsServices.fetchAggregation<IBrand>(Brand, ["brandName", "brandLogo","theme"],req.query)

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

    return res.json({
        success: true,
        message: "Successfully retrieved related brands",
        data: relatedBrands,
    });
};


const StatsController = {
    appFirstStats,
    getRelatedBrands
}
export default StatsController