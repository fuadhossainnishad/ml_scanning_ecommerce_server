import { model, Model, Schema } from "mongoose";
import { IReward } from "./reward.interface";
import MongooseHelper from "../../utility/mongoose.helpers";

const RewardSchema = new Schema<IReward>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reward: {
        type: Number,
        required: true,
    },
    rewardPending: {
        type: Boolean,
        required: true,
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
},
    { timestamps: true }
)

MongooseHelper.applyToJSONTransform(RewardSchema)
MongooseHelper.findExistence(RewardSchema)

const Reward: Model<IReward> = model<IReward>('Reward', RewardSchema)
export default Reward