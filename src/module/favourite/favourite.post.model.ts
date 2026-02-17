import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IFavourite, IFavouritePost } from './favourite.interface';

export const FavouriteSchema: Schema = new Schema<IFavourite>({

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
  isDeleted: {
    type: Boolean,
    default: false
  }
},
)

const FavouritePostSchema = new Schema<IFavouritePost>({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
},
  { timestamps: true }
).add(FavouriteSchema)





MongooseHelper.findExistence<IFavouritePost>(FavouritePostSchema);
MongooseHelper.applyToJSONTransform(FavouritePostSchema);



const FavouritePost: Model<IFavouritePost> = model<IFavouritePost>(
  "FavouritePost",
  FavouritePostSchema
);




export default FavouritePost;



