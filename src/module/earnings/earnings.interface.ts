import { Types } from "mongoose";

export enum WithdrawStatus {
    SUCCESS = 'success',
    PENDING = 'pending',
    CANCEL = 'cancel',
    NONE = 'none'
}

export interface IEarnings {
    brandId: Types.ObjectId,
    stripe_accounts_id: string
    ready_for_withdraw: boolean
    totalEarnings: number
    totalWithdraw: number
    available: number
    withdrawPending: number
    withdrawStatus: WithdrawStatus
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
}