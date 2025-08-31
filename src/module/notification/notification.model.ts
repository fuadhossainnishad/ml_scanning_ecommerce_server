import { model, Model, Schema } from "mongoose";
import { INotification } from "./notification.interface";
import MongooseHelper from "../../utility/mongoose.helpers";

const NotificationSchema: Schema = new Schema<INotification>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    receiverId: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    notifyAdmin: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

MongooseHelper.applyToJSONTransform(NotificationSchema);
MongooseHelper.findExistence(NotificationSchema);
NotificationSchema.index({ ownerId: "text", key: "text" });

const Notification: Model<INotification> = model<INotification>(
  "Notification",
  NotificationSchema
);
export default Notification;
