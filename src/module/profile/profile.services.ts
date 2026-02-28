import { Types } from "mongoose";
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import { getRoleModels } from "../../utility/role.utils";
import { idConverter } from "../../utility/idConverter";
import Admin from "../admin/admin.model";
import { TRole } from "../../types/express";
import { Request } from "express";

const getProfileService = async (req: Request) => {
    const { _id: currentUserId, role: currentUserRole } = req.user

    let userId: Types.ObjectId;
    let userRole: TRole;

    if (!req.params.id) {
        userId = currentUserId;
        userRole = currentUserRole;
    } else {
        userId = await idConverter(req.params.id);
        const findExist = await Admin.findById(userId);

        if (!findExist) {
            throw new AppError(httpStatus.NOT_FOUND, "User/Brand not found");
        }
        userRole = findExist.role;
    }

    const QueryModel = getRoleModels(userRole);

    const profileData = await QueryModel.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(userId),
                isDeleted: false,
            },
        },

        // ─── POST STATS ───────────────────────────────────────────────
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
                totalPosts: { $ifNull: [{ $arrayElemAt: ["$postStats.totalPosts", 0] }, 0] },
                totalReacts: { $ifNull: [{ $arrayElemAt: ["$postStats.totalReacts", 0] }, 0] },
            },
        },
        { $project: { postStats: 0 } },

        // ─── TOTAL FOLLOWERS ──────────────────────────────────────────
        // Count how many people have this user in their following array (isDeleted: false)
        {
            $lookup: {
                from: "follows",
                let: { targetId: "$_id", targetType: "$role" },
                pipeline: [
                    { $unwind: "$following" },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$following.id", "$$targetId"] },
                                    { $eq: ["$following.type", "$$targetType"] },
                                    { $eq: ["$following.isDeleted", false] }, // ← only active follows
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
        { $project: { followersData: 0 } },

        // ─── TOTAL FOLLOWING ──────────────────────────────────────────
        // Count active entries in this user's own following array
        {
            $lookup: {
                from: "follows",
                let: { authorId: "$_id", authorType: "$role" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$authorId", "$$authorId"] },
                                    { $eq: ["$authorType", "$$authorType"] },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            totalFollowing: {
                                $size: {
                                    $filter: {
                                        input: "$following",
                                        cond: { $eq: ["$$this.isDeleted", false] }, // ← only active
                                    },
                                },
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
        { $project: { followingData: 0 } },

        // ─── IS FOLLOWING ─────────────────────────────────────────────
        // Check if current user actively follows this profile
        {
            $lookup: {
                from: "follows",
                let: {
                    meId: currentUserId,
                    targetId: "$_id",
                    targetRole: "$role",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$authorId", "$$meId"] },
                        },
                    },
                    { $unwind: "$following" },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$following.id", "$$targetId"] },
                                    { $eq: ["$following.type", "$$targetRole"] },
                                    { $eq: ["$following.isDeleted", false] }, // ← only active
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
                        { $ne: ["$_id", currentUserId] },
                        { $gt: [{ $size: "$isFollowingData" }, 0] },
                        "$$REMOVE",
                    ],
                },
            },
        },
        { $project: { isFollowingData: 0 } },
    ]);

    if (!profileData || profileData.length === 0) {
        throw new AppError(httpStatus.NOT_FOUND, "Profile not found");
    }

    return profileData[0];
};

const ProfileService = {
    getProfileService
}

export default ProfileService