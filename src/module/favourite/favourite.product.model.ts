import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IFavouriteProduct } from "./favourite.interface";

const favouriteProductSchema: Schema = new Schema<IFavouriteProduct>({

  ownerId: {
    type: Schema.Types.ObjectId,
    refPath: 'ownerType',
    required: true
  },
  ownerType: {
    type: String,
    required: true,
    enum: ['User', 'Brand', 'Admin']
  },
  productId: {
    type: [Schema.Types.ObjectId],
    ref: 'Product',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true }
)


MongooseHelper.findExistence<IFavouriteProduct>(favouriteProductSchema);
MongooseHelper.applyToJSONTransform(favouriteProductSchema);

const FavouriteProduct: Model<IFavouriteProduct> = model<IFavouriteProduct>(
  "FavouriteProduct",
  favouriteProductSchema
);
export default FavouriteProduct;



