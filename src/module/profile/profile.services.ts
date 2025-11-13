import { Request } from "express";
import { Types } from "mongoose";
import httpStatus from "http-status";
import AppError from "../../app/error/AppError";
import Admin from "../admin/admin.model";
import { idConverter } from "../../utility/idConverter";
import { getRoleModels } from "../../utility/role.utils";
import { TRole } from "../../types/express";

const getProfileService = async (req: Request) => {
    const { _id: currentUserId, role: currentUserRole } = req.user;

    let userId: Types.ObjectId;
    let userRole: TRole;


    if (!req.params.id) {
        userId = currentUserId;
        userRole = currentUserRole;
        console.log("profile id:", userId)

    } else {
        userId = await idConverter(req.params.id);
        const findExist = await Admin.findById(userId);

        console.log("profile id:", userId)

        if (!findExist) {
            throw new AppError(httpStatus.NOT_FOUND, "User/Brand not found");
        }
        userRole = findExist.role;
    }
    
    console.log("final profile id:", userId)

    const QueryModel = getRoleModels(userRole);

    const profileData = await QueryModel.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(userId),
                isDeleted: false,
            },
        },

        {
            $lookup: {
                from: "posts",
                let: { uploaderId: "$_id", uploaderType: "$role" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$uploaderId", "$$uploaderId"] },
                                    { $eq: ["$uploaderType", "$$uploaderType"] },
                                ],
                            },
                            isDeleted: false,
                        },
                    },
                    {
                        $lookup: {
                            from: "reacts",
                            localField: "_id",
                            foreignField: "postId",
                            pipeline: [
                                { $match: { isDeleted: false } },
                                { $count: "reactCount" },
                            ],
                            as: "reactData",
                        },
                    },
                    {
                        $addFields: {
                            reactCount: { $ifNull: ["$reactData.0.reactCount", 0] },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalPosts: { $sum: 1 },
                            totalReacts: { $sum: "$reactCount" },
                        },
                    },
                ],
                as: "postStats",
            },
        },
        {
            $addFields: {
                totalPosts: {
                    $ifNull: [{ $arrayElemAt: ["$postStats.totalPosts", 0] }, 0],
                },
                totalReacts: {
                    $ifNull: [{ $arrayElemAt: ["$postStats.totalReacts", 0] }, 0],
                },
            },
        },
        {
            $project: {
                postStats: 0,
            },
        },


        {
            $lookup: {
                from: "follows",
                let: { id: "$_id", type: "$role" },
                pipeline: [
                    { $match: { isDeleted: false } },
                    { $unwind: "$following" },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$following.id", "$$id"] },
                                    { $eq: ["$following.type", "$$type"] },
                                ],
                            },
                        },
                    },
                ],
                as: "followersData",
            },
        },
        {
            $addFields: {
                totalFollowers: { $size: "$followersData" },
            },
        },
        {
            $project: {
                followersData: 0,
            },
        },

        {
            $lookup: {
                from: "follows",
                let: { id: "$_id", type: "$role" },
                pipeline: [
                    { $match: { isDeleted: false } },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$authorId", "$$id"] },
                                    { $eq: ["$authorType", "$$type"] },
                                ],
                            },
                        },
                    },
                ],
                as: "followingData",
            },
        },
        {
            $addFields: {
                totalFollowing: {
                    $ifNull: [{ $arrayElemAt: ["$followingData.totalFollowing", 0] }, 0],
                },
            },
        },
        {
            $project: {
                followingData: 0,
            },
        },

        {
            $lookup: {
                from: "follows",
                let: {
                    meId: new Types.ObjectId(currentUserId),
                    targetId: "$_id",
                    targetRole: "$role",
                },
                pipeline: [
                    { $match: { isDeleted: false } },
                    { $unwind: "$following" },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$authorId", "$$meId"] },
                                    { $eq: ["$following.id", "$$targetId"] },
                                    { $eq: ["$following.type", "$$targetRole"] },
                                ],
                            },
                        },
                    },
                    { $limit: 1 },
                ],
                as: "isFollowingData",
            },
        },
        {
            $addFields: {
                isFollowing: {
                    $cond: [
                        { $ne: ["$_id", new Types.ObjectId(currentUserId)] },
                        { $gt: [{ $size: "$isFollowingData" }, 0] },
                        "$$REMOVE",
                    ],
                },
            },
        },
        {
            $project: {
                isFollowingData: 0,
            },
        },
    ]);

    if (!profileData || profileData.length === 0) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }

    return profileData[0];
};

const ProfileServices = {
    getProfileService,
};

export default ProfileServices;
