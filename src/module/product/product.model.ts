import { model, Model, Schema } from "mongoose";
// import MongooseHelper from "../../utility/mongoose.helpers";
import { IMeasurement, IProduct, TCategory, TSize } from "./product.interface";


const MeasurementSchema = new Schema<IMeasurement>({
  size: {
    type: String,
    enum: Object.values(TSize),
    required: true,
  },
  chest: { type: Number, required: true },
  waist: { type: Number, required: true },
  hips: { type: Number, required: true },
  heightRange: { type: Number, required: true },
});

const ProductSchema = new Schema<IProduct>({
  brandId: {
    type: Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  },
  stripe_product_id: { type: String, required: true },
  productName: { type: String, required: true },
  shortDescription: { type: String, required: true },
  productImages: {
    type: [String],
    required: true,
  },
  colors: {
    type: [String],
    required: true,
  },
  category: {
    type: String,
    enum: Object.values(TCategory),
    required: true,
  },
  measurement: {
    type: [MeasurementSchema],
    required: true,
  },
  totalQuantity: { type: Number, required: true },
  price: { type: Number, required: true },
  inStock: {
    type: Boolean, default: function (this: IProduct) {
      return this.totalQuantity > 0
    }
  },
  stripe_price_id: { type: String, required: true },
  discountPrice: { type: Number, required: true },
  saleTag: { type: Boolean, default: false },
  shippingNote: { type: String, required: true },
});

// MongooseHelper.applyToJSONTransform(ProductSchema);
// MongooseHelper.findExistence<IProduct>(ProductSchema);

const Product: Model<IProduct> = model<IProduct>('Product', ProductSchema);

export default Product;

