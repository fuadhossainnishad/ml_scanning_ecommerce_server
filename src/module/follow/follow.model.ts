import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IFollow } from './follow.interface';

const FollowSchema: Schema = new Schema<IFollow>({
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'authorType',
    required: true
  },
  authorType: {
    type: String,
    required: true,
    enum: ['User', 'Brand', 'Admin']
  },
  followerId: {
    type: [Schema.Types.ObjectId],
    refPath: 'FolloworType',
    required: true
  },
  followerType: {
    type: String,
    required: true,
    enum: ['User', 'Brand', 'Admin']
  },
  totalFollower: {
    type: Number,
    required: true,
    default: function (this: IFollow) {
      return this.followerId.length
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true }
)


MongooseHelper.findExistence<IFollow>(FollowSchema);
MongooseHelper.applyToJSONTransform(FollowSchema);

const Follow: Model<IFollow> = model<IFollow>(
  "Follow",
  FollowSchema
);
export default Follow;



