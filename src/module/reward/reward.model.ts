import { model, Model, Schema } from "mongoose";
import { IReward } from "./reward.interface";
import MongooseHelper from "../../utility/mongoose.helpers";

const RewardSchema = new Schema<IReward>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    reward: {
        type: Number,
        default: 0
    },
    rewardPrice: {
        type: Number,
        default: 0
    },
    rewardPending: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

MongooseHelper.applyToJSONTransform(RewardSchema)
MongooseHelper.findExistence(RewardSchema)

const Reward: Model<IReward> = model<IReward>('Reward', RewardSchema)
export default Reward