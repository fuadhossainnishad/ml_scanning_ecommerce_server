// reward/redemption.model.ts
import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IRedemption, RedeemStatus } from "./reward.interface";

const RedemptionSchema = new Schema<IRedemption>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    pointsRedeemed: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'usd'
    },
    stripe_transfer_id: {
        type: String
    },
    status: {
        type: String,
        enum: Object.values(RedeemStatus),
        default: RedeemStatus.PENDING
    },
    failureReason: {
        type: String
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

MongooseHelper.applyToJSONTransform(RedemptionSchema);
MongooseHelper.findExistence(RedemptionSchema);

const Redemption: Model<IRedemption> = model<IRedemption>('Redemption', RedemptionSchema);
export default Redemption;