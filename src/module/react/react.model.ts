import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import { IReact } from './react.interface';

const ReactSchema: Schema = new Schema<IReact>({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  reactorId: {
    type: Schema.Types.ObjectId,
    refPath: 'reactorType',
    required: true
  },

  reactorType: {
    type: String,
    required: true,
    enum: ['User', 'Brand', 'Admin'] // Define the valid types
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true }
)


MongooseHelper.findExistence<IReact>(ReactSchema);
MongooseHelper.applyToJSONTransform(ReactSchema);

const React: Model<IReact> = model<IReact>(
  "React",
  ReactSchema
);
export default React;



