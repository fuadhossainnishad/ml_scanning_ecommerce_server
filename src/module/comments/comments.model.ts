import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IComments } from "./comments.interface";
import { Role } from "../auth/auth.interface";

const CommentsSchema: Schema = new Schema<IComments>({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  commentorId: {
    type: Schema.Types.ObjectId,
    refPath: 'role',
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: Object.values(Role)
  },
  comments: {
    type: String,
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true }
)


MongooseHelper.findExistence<IComments>(CommentsSchema);
MongooseHelper.applyToJSONTransform(CommentsSchema);

const Comments: Model<IComments> = model<IComments>(
  "Comments",
  CommentsSchema
);
export default Comments;



