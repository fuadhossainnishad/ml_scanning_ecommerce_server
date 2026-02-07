// earnings/earnings.model.ts
import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IEarnings } from "./earnings.interface";

const EarningsSchema = new Schema<IEarnings>({
    brandId: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
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
    totalEarnings: {
        type: Number,
        default: 0
    },
    totalWithdrawn: {
        type: Number,
        default: 0
    },
    pendingBalance: {
        type: Number,
        default: 0
    },
    availableBalance: {
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

MongooseHelper.applyToJSONTransform(EarningsSchema);
MongooseHelper.findExistence(EarningsSchema);

const Earning: Model<IEarnings> = model<IEarnings>('Earning', EarningsSchema);
export default Earning;