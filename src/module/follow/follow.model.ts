import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IFollow, IFollowBase } from "./follow.interface";

const FollowBaseSchema: Schema = new Schema<IFollowBase>({
  id: {
    type: Schema.Types.ObjectId,
    refPath: 'type',
    required: true,
    // unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['User', 'Brand', 'Admin']
  },
})

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
  following: [FollowBaseSchema],
  totalFollowing: {
    type: Number,
    required: false,
    default: function (this: IFollow) {
      return this.following.length
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



