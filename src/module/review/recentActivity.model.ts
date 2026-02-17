import { model, Model, Schema } from 'mongoose';
import MongooseHelper from '../../utility/mongoose.helpers';
import { IRecentActivity } from './review.interface';

const RecentActivitySchema = new Schema(
  {
    title: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

MongooseHelper.applyToJSONTransform(RecentActivitySchema);

const RecentActivity: Model<IRecentActivity> = model<IRecentActivity>(
  'RecentActivity',
  RecentActivitySchema,
);
export default RecentActivity;
