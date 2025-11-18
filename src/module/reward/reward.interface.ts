import { Types } from "mongoose";

export interface IReward {
    userId: Types.ObjectId
    reward: number
    rewardPending: boolean
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
}