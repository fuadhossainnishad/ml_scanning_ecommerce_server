// reward/reward.interface.ts
import { Schema } from "mongoose";

export enum RedeemStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

export interface IReward {
    userId: Schema.Types.ObjectId;
    stripe_account_id: string;
    onboarding_completed: boolean;
    totalSpent: number;
    totalEarned: number;
    totalRedeemed: number;
    pendingRewards: number;
    availableRewards: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IRedemption {
    userId: Schema.Types.ObjectId;
    amount: number;
    pointsRedeemed: number; // NEW: Track points redeemed
    currency: string;
    stripe_transfer_id?: string;
    status: RedeemStatus;
    failureReason?: string;
    requestedAt: Date;
    processedAt?: Date;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}