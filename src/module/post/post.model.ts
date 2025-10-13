import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IPost } from "./post.interface";



const PostSchema: Schema = new Schema<IPost>({
  uploaderId: {
    type: Schema.Types.ObjectId,
    refPath: "uploaderType",
    required: true
  },
  uploaderType: {
    type: String,
    required: true,
    enum: ['User', 'Brand']
  },
  brandId: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
    required: true
  },
  brandName: {
    type: String,
    ref: "Brand",
    required: true
  },
  attachment: {
    type: [String],
    required: true
  },
  caption: {
    type: String,
    required: false,
    default: ""
  },
  tags: [{
    type: String,
    required: true
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true }
)

MongooseHelper.findExistence<IPost>(PostSchema);
MongooseHelper.applyToJSONTransform(PostSchema);

const Post: Model<IPost> = model<IPost>(
  "Post",
  PostSchema
);
export default Post;



