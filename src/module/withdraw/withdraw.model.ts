import { model, Model, Schema } from "mongoose";
import { IWithdraw, WithdrawStatus } from "./withdraw.interface";
import MongooseHelper from "../../utility/mongoose.helpers";

const WithdrawSchema = new Schema<IWithdraw>({
    brandId: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    bank_account_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    withdrawStatus: {
        type: String,
        enum: Object.values(WithdrawStatus),
        default: WithdrawStatus.PENDING
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

MongooseHelper.applyToJSONTransform(WithdrawSchema)
MongooseHelper.findExistence(WithdrawSchema)

const Withdraw: Model<IWithdraw> = model<IWithdraw>('Withdraw', WithdrawSchema)
export default Withdraw