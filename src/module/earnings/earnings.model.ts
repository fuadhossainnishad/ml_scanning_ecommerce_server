import { model, Model, Schema } from "mongoose";
import { IEarnings, WithdrawStatus } from "./earnings.interface";
import MongooseHelper from "../../utility/mongoose.helpers";

const EarningsSchema = new Schema<IEarnings>({
    brandId: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    stripe_accounts_id: {
        type: String,
        default: ''
    },
    ready_for_withdraw: {
        type: Boolean,
        default: false
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    totalWithdraw: {
        type: Number,
        default: 0
    },
    available: {
        type: Number,
        default: 0
    },
    withdrawPending: {
        type: Number,
        default: 0
    },
    withdrawStatus: {
        type: String,
        enum: Object.values(WithdrawStatus),
        default: WithdrawStatus.NONE
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

MongooseHelper.applyToJSONTransform(EarningsSchema)
MongooseHelper.findExistence(EarningsSchema)

const Earning: Model<IEarnings> = model<IEarnings>('Earning', EarningsSchema)
export default Earning