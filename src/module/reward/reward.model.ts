// reward/reward.model.ts
import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IReward } from "./reward.interface";

const RewardSchema = new Schema<IReward>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    stripe_account_id: {
        type: String,
        default: ''
    },
    onboarding_completed: {
        type: Boolean,
        default: false
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    totalEarned: {
        type: Number,
        default: 0
    },
    totalRedeemed: {
        type: Number,
        default: 0
    },
    pendingRewards: {
        type: Number,
        default: 0
    },
    availableRewards: {
        type: Number,
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

MongooseHelper.applyToJSONTransform(RewardSchema);
MongooseHelper.findExistence(RewardSchema);

const Reward: Model<IReward> = model<IReward>('Reward', RewardSchema);
export default Reward;