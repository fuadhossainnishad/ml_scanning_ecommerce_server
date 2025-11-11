import { model, Model, Schema } from "mongoose";
import {
    DeliveryAddress,
    IOrder,
    OrderStatus,
    PaymentStatus,
    RemindeStatus,
    SellerStatus,
    OrderItem
} from "./order.interface";
import MongooseHelper from "../../utility/mongoose.helpers";
import { Role } from "../auth/auth.interface";

const DeliveryAddressSchema = new Schema<DeliveryAddress>({
    name: {
        type: String,
        required: true,
    },
    contact: {
        type: String,
        required: true,
    },
    spotDetails: {
        type: String,
        required: true,
    },
});

const OrderItemSchema = new Schema<OrderItem>({
    cartProductId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Cart.products",
    },
    sellerStatus: {
        type: String,
        enum: Object.values(SellerStatus),
        required: true,
        default: SellerStatus.MARK_READY,
    },
    remindStatus: {
        type: String,
        enum: Object.values(RemindeStatus),
        required: true,
        default: RemindeStatus.PROCESSING,
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
    shippedAt: {
        type: Date,
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
});

const OrderSchema = new Schema<IOrder>(
    {
        cartId: {
            type: Schema.Types.ObjectId,
            ref: "Cart",
            required: true,
            unique: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            refPath: "userType",
            required: true,
        },
        userType: {
            type: String,
            required: true,
            enum: Object.values(Role),
        },
        address: {
            type: DeliveryAddressSchema,
            required: true,
        },
        items: {
            type: [OrderItemSchema],
            default: [],
            required: true,
        },
        orderStatus: {
            type: String,
            enum: Object.values(OrderStatus),
            required: true,
            default: OrderStatus.PROCESSING,
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PaymentStatus),
            required: true,
            default: PaymentStatus.PENDING,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

MongooseHelper.applyToJSONTransform(OrderSchema);
MongooseHelper.findExistence(OrderSchema);

const computeOrderStatus = (items: IOrder['items']): OrderStatus => {
    const allReady = items.every(item => item.sellerStatus === SellerStatus.MARK_READY);
    const allShipping = items.every(item => item.sellerStatus === SellerStatus.MARK_FOR_SHIPPING);
    const allComplete = items.every(item => item.sellerStatus === SellerStatus.MARK_FOR_COMPLETE);

    if (allComplete) {
        return OrderStatus.DELIVERED;
    }
    if (allShipping) {
        return OrderStatus.SHIPPED;
    }
    if (allReady) {
        return OrderStatus.CONFIRM;
    }
    return OrderStatus.PROCESSING;
};

OrderSchema.post('save', function (doc) {
    if (doc.paymentStatus === 'pending') return;

    const newStatus = computeOrderStatus(doc.items);
    if (newStatus !== doc.orderStatus) {
        doc.orderStatus = newStatus;
        doc.save();
    }
})

const Order: Model<IOrder> = model<IOrder>("Order", OrderSchema);
export default Order;
