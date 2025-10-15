import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IFavouritePost } from './favourite.interface';

const favouritePostSchema: Schema = new Schema<IFavouritePost>({

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
  postId: {
    type: [Schema.Types.ObjectId],
    ref: 'Post',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true }
)


MongooseHelper.findExistence<IFavouritePost>(favouritePostSchema);
MongooseHelper.applyToJSONTransform(favouritePostSchema);

const FavouritePost: Model<IFavouritePost> = model<IFavouritePost>(
  "FavouritePost",
  favouritePostSchema
);
export default FavouritePost;



