import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { ICart, IProducts } from "./cart.interface";
import { TSize } from "../product/product.interface";

export const ProductsSchema: Schema = new Schema<IProducts>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      enum: Object.values(TSize),
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CartSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [ProductsSchema],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MongooseHelper.applyToJSONTransform(CartSchema);
MongooseHelper.findExistence(CartSchema);

const Cart: Model<ICart> = model<ICart>("Cart", CartSchema);
export default Cart;
