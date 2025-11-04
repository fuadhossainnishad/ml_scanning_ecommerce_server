import { Types } from "mongoose";

export interface IReward {
    userId: Types.ObjectId
    totalSpent: number
    reward: number
    spentReward: number
    remainReward: number
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
}