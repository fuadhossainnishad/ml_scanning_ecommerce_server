// withdraw/withdraw.interface.ts
import { Schema } from "mongoose";

export enum WithdrawStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

export interface IWithdraw {
    brandId: Schema.Types.ObjectId;
    amount: number;
    currency: string;
    stripe_transfer_id?: string;
    status: WithdrawStatus;
    failureReason?: string;
    requestedAt: Date;
    processedAt?: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}