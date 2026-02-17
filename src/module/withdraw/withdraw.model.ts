// withdraw/withdraw.model.ts
import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IWithdraw, WithdrawStatus } from "./withdraw.interface";

const WithdrawSchema = new Schema<IWithdraw>({
    brandId: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    amount: {
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
        enum: Object.values(WithdrawStatus),
        default: WithdrawStatus.PENDING
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

MongooseHelper.applyToJSONTransform(WithdrawSchema);
MongooseHelper.findExistence(WithdrawSchema);

const Withdraw: Model<IWithdraw> = model<IWithdraw>('Withdraw', WithdrawSchema);
export default Withdraw;