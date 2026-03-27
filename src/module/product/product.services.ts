import { PipelineStage, Types } from "mongoose";
import Product from "./product.model";
import { ParsedQs } from "qs";
import AggregationQueryBuilder from "../../app/builder/Builder";

const getAllProductsWithFavourite = async (
    query: ParsedQs,
    userId?: string
) => {
    const ownerObjectId = userId ? new Types.ObjectId(userId) : null;

    const favouriteLookupStages: PipelineStage[] = [
        {
            $lookup: {
                from: "favouriteproducts",
                let: { productId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$productId", "$$productId"] },
                                    { $eq: ["$ownerId", ownerObjectId] },
                                    { $eq: ["$isDeleted", false] },
                                ],
                            },
                        },
                    },
                    { $limit: 1 },
                    { $project: { _id: 1 } },
                ],
                as: "_favourites",
            },
        },
        {
            $addFields: {
                isFavourite: { $gt: [{ $size: "$_favourites" }, 0] },
            },
        },
        {
            $project: { _favourites: 0 },
        },
    ];

    const builder = new AggregationQueryBuilder(
        Product,
        query as Record<string, unknown>
    )
        .search(["productName", "shortDescription", "brandName", "category"])
        .filter()
        .sort()
        .fields()
        .addStages(favouriteLookupStages);

    const meta = await builder.countTotal();
    const data = await builder.execute();

    return {
        meta,
        product: data,
    };
};

const ProductServices = {
    getAllProductsWithFavourite,
};

export default ProductServices;