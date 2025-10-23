import { model, Model, Schema } from "mongoose";
import { IOrder } from "./order.interface";
import { ProductsSchema } from "../cart/cart.model";
import MongooseHelper from "../../utility/mongoose.helpers";
import { Role } from '../auth/auth.interface';

const OrderSchema = new Schema<IOrder>({
    paymentId: {
        type: Schema.Types.ObjectId,
        ref: "Payment",
        required: true,
    },
    paymentStatus: { type: Boolean, required: true },
    paymentMethod: { type: String, required: true },
    userId: {
        type: Schema.Types.ObjectId,
        refPath: "userType",
        required: true,
    },
    userType: {
        type: String,
        required: true,
        enum: Object.values(Role)
    },
    products: [{
        type: ProductsSchema,
        required: true,
    }],
    subTotal: { type: Number, required: true },
    shippingCharge: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    orderStatus: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
})


MongooseHelper.applyToJSONTransform(OrderSchema);
MongooseHelper.findExistence(OrderSchema);

const Order: Model<IOrder> = model<IOrder>("Order", OrderSchema);
export default Order;