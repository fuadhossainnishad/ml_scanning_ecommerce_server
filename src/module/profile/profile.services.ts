import httpStatus from "http-status";
import { Request } from "express";
import { getRoleModels } from "../../utility/role.utils";
import { idConverter } from "../../utility/idConverter";
import { Types } from "mongoose";
import Admin from "../admin/admin.model";
import AppError from "../../app/error/AppError";
import { TRole } from '../../types/express';

const getProfile = async (req: Request) => {
    const { _id, role } = req.user;
    let userId: Types.ObjectId
    let userRole: TRole
    if (!req.params.id) {
        userId = _id
        userRole = role

    } else {
        userId = await idConverter(req.params.id)
        console.log("req.params.id:", req.params.id);
        const findExist = await Admin.findById(userId)
        if (!findExist) {
            throw new AppError(httpStatus.NOT_FOUND, "User/Brand not found")
        }
        userRole = findExist.role

    }

    console.log("Role:", userRole);

    const QueryModel = getRoleModels(userRole);

    const [result] = await QueryModel.aggregate([
        { $match: { _id: userId, role: userRole, isDeleted: false } },
        {
            $project: {
                stripe_customer_id: 0,
                confirmedPassword: 0,
                password: 0,
                passwordUpdatedAt: 0,
                last_login: 0,
                failed_attempts: 0,
                createdAt: 0,
                updatedAt: 0,
                isDeleted: 0,
                __t: 0,
                __v: 0,
            }
        },
        {
            $lookup: {
                from: "posts",
                let: { userId: "$_id", userType: "$userRole" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$uploaderId", "$$userId"] },
                                    { $eq: ["$uploaderType", "$$userType"] }
                                ]
                            },
                            isDeleted: false
                        }
                    },
                    {
                        $facet: {
                            totals: [
                                {
                                    $lookup: {
                                        from: "reacts",
                                        localField: "_id",
                                        foreignField: "postId",
                                        pipeline: [
                                            { $match: { isDeleted: false } },
                                            { $count: "reactCount" }
                                        ],
                                        as: "reactData"
                                    }
                                },
                                {
                                    $addFields: {
                                        reactCount: {
                                            $ifNull: ["$reactData.0.reactCount", 0]
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        totalPosts: { $sum: 1 },
                                        totalReacts: { $sum: "$reactCount" }
                                    }
                                }
                            ],
                        }
                    }
                ],
                as: "postData"
            }
        },
        {
            $addFields: {
                postData: {
                    $ifNull: [{ $arrayElemAt: ["$postData", 0] }, { totals: [] }]
                }
            }
        },
        {
            $addFields: {
                totalPosts: { $ifNull: ["$postData.totals.0.totalPosts", 0] },
                totalReacts: { $ifNull: ["$postData.totals.0.totalReacts", 0] }
            }
        },
        {
            $lookup: {
                from: "follows",
                let: { userId: "$_id", userType: "$userRole" },
                pipeline: [
                    { $match: { isDeleted: false } },
                    { $unwind: "$following" },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$following.id", "$$userId"] },
                                    { $eq: ["$following.type", "$$userType"] }
                                ]
                            }
                        }
                    },
                    { $count: "totalFollowers" }
                ],
                as: "followerData"
            }
        },
        {
            $addFields: {
                totalFollowers: {
                    $ifNull: ["$followerData.0.totalFollowers", 0]
                }
            }
        },
        {
            $project: {
                followerData: 0,
                postData: 0
            }
        }
    ]).exec();

    if (!result) {
        throw new Error("User profile not found");
    }


    return {
        data: result
    };
};

const ProfileServices = {
    getProfile
};

export default ProfileServices;