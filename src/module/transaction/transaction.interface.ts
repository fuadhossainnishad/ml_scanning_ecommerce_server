import { Types } from "mongoose";

export enum WithdrawStatus {
    SUCCESS = 'success',
    PENDING = 'pending',
    CANCEL = 'cancel',
    NONE = 'none'
}

export interface IWithdraw {
    brandId: Types.ObjectId,
    bank_account_id: string
    amount: number
    withdrawStatus: WithdrawStatus
    isDeleted: boolean
    createdAt: Date
    updatedAt: Date
}