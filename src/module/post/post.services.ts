import { Request } from "express";
import Post from "./post.model";
import { buildMeta, calculatePagination } from "../stats/stats.services";

const parseSortQuery = (sort: unknown): Record<string, 1 | -1> => {
    if (typeof sort !== "string") return { createdAt: -1 };
    const [field, order] = sort.split(":");
    return { [field]: order === "1" ? 1 : -1 };
};
const getPostService = async (req: Request) => {
    const userId = req.user._id
    const { page, limit, skip } = calculatePagination(req.query);
    const { sort } = req.query
    const sortObject = parseSortQuery(sort);
    const total = await Post.countDocuments();

    const result = await Post.aggregate([
        {
            $match: { isDeleted: false },
        },
        {
            $lookup: {
                from: "Admin",
                localField: "uploaderId",
                foreignField: "_id",
                as: "uploaderDetails",
            },

        },
        {
            $lookup: {
                from: "comments",
                let: { postId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$postId", "$$postId"] },
                                    { $eq: ["$isDeleted", false] },
                                ],
                            },
                        },
                    },
                ],
                as: "commentsData",
            },
        },
        {
            $lookup: {
                from: "react",
                let: { postId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$postId", "$$postId"] },
                                    { $eq: ["$isDeleted", false] },
                                ],
                            },
                        },
                    },
                ],
                as: "reactsData",
            },
        },
        {
            $unwind: {
                path: "$uploaderDetails",
                preserveNullAndEmptyArrays: true,
            },

        },
        {
            $project: {
                uploaderId: 1,
                uploaderType: 1,
                brandId: 1,
                brandName: 1,
                attachment: 1,
                caption: 1,
                tags: 1,
                totalComments: { $size: "$commentsData" },
                totalReacts: { $size: "$reactsData" },
                isReacted: userId ? {
                    $in: [
                        userId, "$reactsData.reactorId"
                    ]
                } : false,
                "uploaderDetails.userName": { $ifNull: ["$uploaderDetails.userName", ""] },
                "uploaderDetails.firstName": { $ifNull: ["$uploaderDetails.firstName", ""] },
                "uploaderDetails.lastName": { $ifNull: ["$uploaderDetails.lastName", ""] },
                "uploaderDetails.profile": { $ifNull: ["$uploaderDetails.profile", ""] },
                "uploaderDetails.brandLogo": { $ifNull: ["$uploaderDetails.brandLogo", ""] },
                isDeleted: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
        {
            $sort: sortObject
        },
        {
            $limit: limit
        },
        { $skip: skip }
    ]);

    return {
        meta: buildMeta(page, limit, total),
        data: result
    };

}

const PostServices = {
    getPostService
}

export default PostServices;