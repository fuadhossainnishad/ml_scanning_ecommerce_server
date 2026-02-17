import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";

export enum EscrowStatus {
    HELD = 'held',              // Money held in platform account
    RELEASED = 'released',       // Money transferred to brand
    REFUNDED = 'refunded',      // Money refunded to customer
}

export interface IEscrow {
    orderId: Schema.Types.ObjectId;
    brandId: Schema.Types.ObjectId;
    customerId: Schema.Types.ObjectId;
    cartProductId: Schema.Types.ObjectId;
    productId: Schema.Types.ObjectId;
    totalAmount: number;         // Total amount for this product
    platformFee: number;         // Platform commission (10%)
    brandEarning: number;        // Amount brand will receive
    status: EscrowStatus;
    stripe_payment_intent_id: string;
    stripe_transfer_id?: string; // Set when money transferred to brand
    heldAt: Date;
    releasedAt?: Date;
    canRelease: boolean;         // True when order is delivered
    metadata?: Record<string, unknown>;
    isDeleted: boolean;
}

const EscrowSchema = new Schema<IEscrow>({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    brandId: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cartProductId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    platformFee: {
        type: Number,
        required: true
    },
    brandEarning: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(EscrowStatus),
        default: EscrowStatus.HELD
    },
    stripe_payment_intent_id: {
        type: String,
        required: true
    },
    stripe_transfer_id: {
        type: String
    },
    heldAt: {
        type: Date,
        default: Date.now
    },
    releasedAt: {
        type: Date
    },
    canRelease: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Object,
        default: {}
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for performance
EscrowSchema.index({ orderId: 1 });
EscrowSchema.index({ brandId: 1, status: 1 });
EscrowSchema.index({ status: 1, canRelease: 1 });

MongooseHelper.applyToJSONTransform(EscrowSchema);
MongooseHelper.findExistence(EscrowSchema);

const Escrow: Model<IEscrow> = model<IEscrow>('Escrow', EscrowSchema);
export default Escrow;