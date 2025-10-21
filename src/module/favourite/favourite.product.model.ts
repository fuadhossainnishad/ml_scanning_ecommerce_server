import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IFavouriteProduct } from "./favourite.interface";
import { FavouriteSchema } from "./favourite.post.model";

const FavouriteProductSchema = new Schema<IFavouriteProduct>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
},
  { timestamps: true }
).add(FavouriteSchema)


MongooseHelper.findExistence<IFavouriteProduct>(FavouriteProductSchema);
MongooseHelper.applyToJSONTransform(FavouriteProductSchema);

const FavouriteProduct: Model<IFavouriteProduct> = model<IFavouriteProduct>(
  "FavouriteProduct",
  FavouriteProductSchema
);
export default FavouriteProduct;



