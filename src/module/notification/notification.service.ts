import httpStatus from "http-status";
import AppError from "../../app/error/AppError";
import { emitMessage, emitMessageToAdmin } from "../../utility/socket.helpers";
import { INotification } from "./notification.interface";
import Notification from "./notification.model";

const sendNoification = async (payload: INotification) => {
  const { data, receiverId, key, notifyAdmin } = payload;
  const newNotification = await Notification.create(payload);
  if (!newNotification) {
    throw new AppError(
      httpStatus.NOT_IMPLEMENTED,
      "Notification is not stored on database"
    );
  }
  receiverId.forEach((id) => {
    emitMessage(id.toString(), key, data);
  });
  if (notifyAdmin) {
    emitMessageToAdmin(key, data);
  }
  return { notification: newNotification };
};

const NotificationServices = {
  sendNoification,
};

export default NotificationServices;
