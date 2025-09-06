import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IComments, IPost } from "./post.interface";

const CommentsSchema: Schema = new Schema<IComments>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true
  }
})

const PostSchema: Schema = new Schema<IPost>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  brandId: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
    required: true
  },
  brandName: {
    type: String,
    required: true
  },
  attachment: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    required: true
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  totalLikes: {
    type: Number,
    required: true
  },
  comments: [{
    type: CommentsSchema,
    required: true
  }],
  totalComments: {
    type: Number,
    required: true
  }
})

MongooseHelper.findExistence<IPost>(PostSchema);
MongooseHelper.applyToJSONTransform(PostSchema);

const Post: Model<IPost> = model<IPost>(
  "Post",
  PostSchema
);
export default Post;



