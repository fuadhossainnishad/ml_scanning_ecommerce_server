import { model, Model, Schema } from 'mongoose';
import MongooseHelper from '../../utility/mongoose.helpers';
import { IReport } from './report.interface';

const ReportSchema = new Schema<IReport>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Post",
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    report: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 500,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

MongooseHelper.applyToJSONTransform(ReportSchema);

const Report: Model<IReport> = model<IReport>(
  'Report',
  ReportSchema,
);
export default Report;

