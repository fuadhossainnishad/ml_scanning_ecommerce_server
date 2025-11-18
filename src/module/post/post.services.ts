// import { Request } from "express";
// import Post from "./post.model";
// import { buildMeta, calculatePagination } from "../stats/stats.services";
// import { FilterQuery, Query } from 'mongoose';

// export const parseSortQuery = (sort: unknown): Record<string, 1 | -1> => {
//     if (typeof sort !== "string") return { createdAt: -1 };
//     const [field, order] = sort.split(":");
//     return { [field]: order === "1" ? 1 : -1 };
// };

// export const filter = <T>(query: Record<string, unknown>) => {
//     const queryObject = { ...query };
//     const excludeField = ["searchTerm", "sort", "limit", "page", "fields"];
//     excludeField.forEach((field) => delete queryObject[field]);
//     return queryObject as FilterQuery<T>;
// }

// const getPostService = async (req: Request) => {
//     const userIdStr = req.user?._id?.toString() || null;
//     const userRole = req.user?.role || null;
//     const { page, limit, skip } = calculatePagination(req.query);
//     const { sort } = req.query;
//     const sortObject = parseSortQuery(sort);
//     const query = filter(req.query)
//     const total = await Post.find(query).countDocuments({ isDeleted: false });
//     console.log("post query:", { ...query, isDeleted: false })
//     const isReactedExpr = userIdStr && userRole ? {
//         $gt: [
//             {
//                 $size: {
//                     $filter: {
//                         input: "$reactsData",
//                         cond: {
//                             $and: [
//                                 { $eq: [{ $toString: "$$this.reactorId" }, userIdStr] },
//                                 { $eq: ["$$this.reactorType", userRole] }
//                             ]
//                         }
//                     }
//                 }
//             },
//             0
//         ]
//     } : false;

//     const isSavePostExpr = userIdStr && userRole ? {
//         $gt: [
//             {
//                 $size: {
//                     $filter: {
//                         input: "$savepostsData",
//                         cond: {
//                             $and: [
//                                 { $eq: [{ $toString: "$$this.saverId" }, userIdStr] },
//                                 { $eq: ["$$this.saverType", userRole] }
//                             ]
//                         }
//                     }
//                 }
//             },
//             0
//         ]
//     } : false;

//     const result = await Post.aggregate([
//         {
//             $match: { ...query, isDeleted: false },
//         },
//         {
//             $lookup: {
//                 from: "Admin",
//                 localField: "uploaderId",
//                 foreignField: "_id",
//                 pipeline: [{ $match: { isDeleted: false } }],
//                 as: "userDetails",
//             },
//         },
//         {
//             $lookup: {
//                 from: "Admin",
//                 localField: "uploaderId",
//                 foreignField: "_id",
//                 pipeline: [{ $match: { isDeleted: false } }],
//                 as: "postBrandDetails",
//             },
//         },
//         {
//             $lookup: {
//                 from: "comments",
//                 let: { postId: "$_id" },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     { $eq: ["$postId", "$$postId"] },
//                                     { $eq: ["$isDeleted", false] },
//                                 ],
//                             },
//                         },
//                     },
//                 ],
//                 as: "commentsData",
//             },
//         },
//         {
//             $lookup: {
//                 from: "reacts",
//                 let: { postId: "$_id" },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     { $eq: ["$postId", "$$postId"] },
//                                     { $eq: ["$isDeleted", false] },
//                                 ],
//                             },
//                         },
//                     },
//                 ],
//                 as: "reactsData",
//             },
//         },
//         {
//             $lookup: {
//                 from: "saveposts",
//                 let: { postId: "$_id" },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     { $eq: ["$postId", "$$postId"] },
//                                     { $eq: ["$isDeleted", false] },
//                                 ],
//                             },
//                         },
//                     },
//                 ],
//                 as: "savepostsData",
//             },
//         },
//         {
//             $addFields: {
//                 uploaderDetails: {
//                     $cond: {
//                         if: { $eq: ["$uploaderType", "User"] },
//                         then: { $arrayElemAt: ["$userDetails", 0] },
//                         else: { $arrayElemAt: ["$postBrandDetails", 0] }
//                     }
//                 }
//             }
//         },
//         {
//             $addFields: {
//                 profile: {
//                     $cond: {
//                         if: { $eq: ["$uploaderType", "Brand"] },
//                         then: "$uploaderDetails.brandLogo",
//                         else: "$uploaderDetails.profile"
//                     }
//                 },
//                 firstName: "$uploaderDetails.firstName",
//                 lastName: "$uploaderDetails.lastName",
//                 userName: "$uploaderDetails.userName",
//             }
//         },
//         {
//             $addFields: {
//                 uploaderDetails: {
//                     $mergeObjects: [
//                         "$uploaderDetails",
//                         {
//                             brandLogo: "$brandLogo"
//                         }
//                     ]
//                 },
//                 totalComments: { $size: "$commentsData" },
//                 totalReacts: { $size: "$reactsData" },
//                 isReacted: isReactedExpr,
//                 isSavePost: isSavePostExpr
//             }
//         },
//         {
//             $project: {
//                 // uploaderId: 1,
//                 // uploaderType: 1,
//                 // brandId: 1,
//                 // brandName: 1,
//                 // attachment: 1,
//                 // caption: 1,
//                 // tags: 1,
//                 // totalComments: 1,
//                 // totalReacts: 1,
//                 // isReacted: 1,
//                 // isSavePost: 1,
//                 // "uploaderDetails.brandStory": { $ifNull: ["$uploaderDetails.userName", ""] },
//                 // "uploaderDetails.firstName": { $ifNull: ["$uploaderDetails.firstName", ""] },
//                 // "uploaderDetails.lastName": { $ifNull: ["$uploaderDetails.lastName", ""] },
//                 // "uploaderDetails.profile": { $ifNull: ["$uploaderDetails.profile", [] ] },
//                 // "uploaderDetails.brandLogo": 0,  // <-- Removed this line to include brandLogo in output for Brands
//                 // createdAt: 1,
//                 uploaderDetails: 0,
//                 userDetails: 0,
//                 postBrandDetails: 0,
//                 reactsData: 0,
//                 commentsData: 0,
//                 updatedAt: 0,
//                 isDeleted: 0,
//                 savepostsData: 0,
//                 __v: 0,

//             },
//         },
//         {
//             $sort: sortObject
//         },
//         {
//             $skip: skip
//         },
//         {
//             $limit: limit
//         },

//     ]);

//     return {
//         meta: buildMeta(page, limit, total),
//         data: result
//     };
// }




import { buildMeta } from "../stats/stats.services";
import { Request } from "express";
import Post from "./post.model";
import AggregationQueryBuilder from "../../app/builder/Builder";

const getPostService = async (req: Request) => {
    const userIdStr = req.user?._id?.toString() || null;
    const userRole = req.user?.role || null;

    console.log("Get post id:", userIdStr)

    const query: Record<string, unknown> = {};

    Object.entries(req.query).forEach(([key, value]) => {
        if (key !== "tags") query[key] = value;
    });

    if (req.query.tags === "User" || req.query.tags === "Brand") {
        query.uploaderType = req.query.tags;
    }
    else if (req.query.tags === "New") {
        query.sort = "{createdAt:-1}";
    }
    else if (req.query.tags) {
        query.tags = req.query.tags;
    }

    console.log("Final Post Query:", query);



    const builder = new AggregationQueryBuilder(Post, query);

    builder.filter();
    builder.search(["caption", "tags"]);

    const isReactedExpr = userIdStr && userRole ? {
        $gt: [
            {
                $size: {
                    $filter: {
                        input: "$reactsData",
                        cond: {
                            $and: [
                                { $eq: [{ $toString: "$$this.reactorId" }, userIdStr] },
                                { $eq: ["$$this.reactorType", userRole] }
                            ]
                        }
                    }
                }
            },
            0
        ]
    } : false;

    const isSavePostExpr = userIdStr && userRole ? {
        $gt: [
            {
                $size: {
                    $filter: {
                        input: "$savepostsData",
                        cond: {
                            $and: [
                                { $eq: [{ $toString: "$$this.saverId" }, userIdStr] },
                                { $eq: ["$$this.saverType", userRole] }
                            ]
                        }
                    }
                }
            },
            0
        ]
    } : false;

    builder.addStages([
        {
            $lookup: {
                from: "Admin",
                localField: "uploaderId",
                foreignField: "_id",
                pipeline: [{ $match: { isDeleted: false } }],
                as: "userDetails",
            },
        },
        {
            $lookup: {
                from: "Admin",
                localField: "uploaderId",
                foreignField: "_id",
                pipeline: [{ $match: { isDeleted: false } }],
                as: "postBrandDetails",
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
                from: "reacts",
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
            $lookup: {
                from: "saveposts",
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
                as: "savepostsData",
            },
        },
        {
            $addFields: {
                uploaderDetails: {
                    $cond: {
                        if: { $eq: ["$uploaderType", "User"] },
                        then: { $arrayElemAt: ["$userDetails", 0] },
                        else: { $arrayElemAt: ["$postBrandDetails", 0] }
                    }
                }
            }
        },
        {
            $addFields: {
                profile: {
                    $cond: {
                        if: { $eq: ["$uploaderType", "Brand"] },
                        then: "$uploaderDetails.brandLogo",
                        else: "$uploaderDetails.profile"
                    }
                },
                firstName: "$uploaderDetails.firstName",
                lastName: "$uploaderDetails.lastName",
                userName: "$uploaderDetails.userName",
            }
        },
        {
            $addFields: {
                uploaderDetails: {
                    $mergeObjects: [
                        "$uploaderDetails",
                        {
                            brandLogo: "$brandLogo"
                        }
                    ]
                },
                totalComments: { $size: "$commentsData" },
                totalReacts: { $size: "$reactsData" },
                isReacted: isReactedExpr,
                isSavePost: isSavePostExpr
            }
        },
        {
            $project: {
                // uploaderId: 1,
                // uploaderType: 1,
                // brandId: 1,
                // brandName: 1,
                // attachment: 1,
                // caption: 1,
                // tags: 1,
                // totalComments: 1,
                // totalReacts: 1,
                // isReacted: 1,
                // isSavePost: 1,
                // "uploaderDetails.brandStory": { $ifNull: ["$uploaderDetails.userName", ""] },
                // "uploaderDetails.firstName": { $ifNull: ["$uploaderDetails.firstName", ""] },
                // "uploaderDetails.lastName": { $ifNull: ["$uploaderDetails.lastName", ""] },
                // "uploaderDetails.profile": { $ifNull: ["$uploaderDetails.profile", [] ] },
                // "uploaderDetails.brandLogo": 0,  // <-- Removed this line to include brandLogo in output for Brands
                // createdAt: 1,
                uploaderDetails: 0,
                userDetails: 0,
                postBrandDetails: 0,
                reactsData: 0,
                commentsData: 0,
                updatedAt: 0,
                isDeleted: 0,
                savepostsData: 0,
                __v: 0,

            },
        },
    ]);

    builder.sort();
    builder.fields();

    // Get meta (includes count)
    const meta = await builder.countTotal();

    console.log("post query:", builder.getMatchObj());

    // Execute
    const data = await builder.execute();

    return {
        meta: buildMeta(meta.page, meta.limit, meta.total), // Assuming buildMeta takes page, limit, total
        data,
    };
};

const PostServices = {
    getPostService
}

export default PostServices;