import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IReview } from "./review.interface";



const ReviewSchema: Schema = new Schema<IReview>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  attachment: {
    type: [String],
    required: false,
    default: [],
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
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// MongooseHelper.excludeFields(ReviewSchema, ["firstName", "lastName"], "Admin");
MongooseHelper.applyToJSONTransform(ReviewSchema);

const Review: Model<IReview> = model<IReview>("Review", ReviewSchema);
export default Review;
