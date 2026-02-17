// notification/notification.interface.ts
import { Types } from "mongoose";

export enum NotificationType {
  ORDER_PLACED = 'order_placed',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  REWARD_EARNED = 'reward_earned',
  REWARD_REDEEMED = 'reward_redeemed',
  WITHDRAWAL_SUCCESS = 'withdrawal_success',
  WITHDRAWAL_FAILED = 'withdrawal_failed',
  PROMOTION = 'promotion',
  SYSTEM = 'system'
}

export interface INotification {
  ownerId: Types.ObjectId;
  key: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  receiverId: Types.ObjectId[];
  notifyAdmin: boolean;
  isRead: boolean;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISendNotificationPayload {
  ownerId: Types.ObjectId;
  receiverId: Types.ObjectId[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  notifyAdmin?: boolean;
}