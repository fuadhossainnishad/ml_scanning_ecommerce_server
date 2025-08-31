import { Types } from "mongoose";
export interface INotification {
  ownerId: Types.ObjectId;
  key: string;
  data: object;
  receiverId: Types.ObjectId[];
  notifyAdmin?: boolean;
}

export type TNotification = Partial<INotification> & {
  ownerId: string;
  receiverId: string[];
};
