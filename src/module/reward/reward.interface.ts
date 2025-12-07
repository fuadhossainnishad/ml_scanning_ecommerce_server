import { Types } from "mongoose";

export interface IReward {
    userId: Types.ObjectId
    reward: number
    totalSpent: number
    rewardPrice: number
    rewardPending: boolean
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
}