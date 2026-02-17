// notification/notification.model.ts
import { model, Model, Schema } from "mongoose";
import { INotification, NotificationType } from "./notification.interface";
import MongooseHelper from "../../utility/mongoose.helpers";

const NotificationSchema: Schema = new Schema<INotification>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    key: {
      type: String,
      required: true,
      default: 'notification'
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    data: {
      type: Object,
      default: {},
      required: true
    },
    receiverId: [{
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }],
    notifyAdmin: {
      type: Boolean,
      default: false
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    sentAt: {
      type: Date
    },
    readAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Compound indexes for performance
NotificationSchema.index({ ownerId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ receiverId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

MongooseHelper.applyToJSONTransform(NotificationSchema);
MongooseHelper.findExistence(NotificationSchema);

const Notification: Model<INotification> = model<INotification>(
  "Notification",
  NotificationSchema
);

export default Notification;