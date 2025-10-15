import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { ISelect } from "./cart.interface";
import { TSize } from "../product/product.interface";



const SelectSchema: Schema = new Schema<ISelect>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: [Schema.Types.ObjectId],
    ref: 'Product',
    required: true
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
  ratings: {
    type: Number,
    validate: function (this: IReview) {
      return this.ratings > 0 && this.ratings < 6
    },
    required: true
  },
  comments: {
    type: String,
    required: true
  }
})

// MongooseHelper.excludeFields(ReviewSchema, ["firstName", "lastName"], "Admin");
MongooseHelper.applyToJSONTransform(ReviewSchema);

const Review: Model<IReview> = model<IReview>("Review", ReviewSchema);
export default Review;
