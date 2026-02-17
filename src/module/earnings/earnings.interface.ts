import { Schema } from "mongoose";

// export enum WithdrawStatus {
//     SUCCESS = 'success',
//     PENDING = 'pending',
//     CANCEL = 'cancel',
//     NONE = 'none'
// }


export interface IEarnings {
    brandId: Schema.Types.ObjectId;
    stripe_account_id: string;
    onboarding_completed: boolean;
    totalEarnings: number;
    totalWithdrawn: number;
    pendingBalance: number;
    availableBalance: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}