import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { ISavePost } from "./Save.interface";

const SavePostSchema: Schema = new Schema<ISavePost>({

  saverId: {
    type: Schema.Types.ObjectId,
    refPath: 'saverType',
    required: true
  },
  saverType: {
    type: String,
    required: true,
    enum: ['User', 'Brand', 'Admin']
  },
  postId: {
    type: Schema.Types.ObjectId,
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


MongooseHelper.findExistence<ISavePost>(SavePostSchema);
MongooseHelper.applyToJSONTransform(SavePostSchema);

const SavePost: Model<ISavePost> = model<ISavePost>(
  "SavePost",
  SavePostSchema
);
export default SavePost;



