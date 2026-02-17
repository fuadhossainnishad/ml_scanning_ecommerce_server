// notification/notification.service.ts
import Notification from "./notification.model";
import Admin from "../admin/admin.model";
import { ISendNotificationPayload } from "./notification.interface";
import { Types } from "mongoose";
import { FCMService } from "./fcm.service";

class NotificationService {
    /**
     * Send push notification
     */
    static async sendNotification(payload: ISendNotificationPayload) {
        try {
            console.log('📨 Sending notification:', payload.title);

            // Save to database
            const notification = await Notification.create({
                ownerId: payload.ownerId,
                key: 'notification',
                type: payload.type,
                title: payload.title,
                body: payload.body,
                data: payload.data || {},
                receiverId: payload.receiverId,
                notifyAdmin: payload.notifyAdmin || false,
                isRead: false,
                sentAt: new Date()
            });

            // Get recipients with FCM tokens
            const recipients = await Admin.find({
                _id: { $in: payload.receiverId }
            }).select('fcmTokens');

            // Collect all FCM tokens
            const allTokens: string[] = [];
            recipients.forEach(user => {
                if (user.fcmTokens && user.fcmTokens.length > 0) {
                    user.fcmTokens.forEach((tokenObj: any) => {
                        allTokens.push(tokenObj.token);
                    });
                }
            });

            if (allTokens.length === 0) {
                console.log('⚠️ No FCM tokens found');
                return { notification, sentCount: 0 };
            }

            // Prepare data (must be strings)
            const fcmData: Record<string, string> = {
                notificationId: notification._id.toString(),
                type: payload.type
            };

            if (payload.data) {
                Object.keys(payload.data).forEach(key => {
                    fcmData[key] = String(payload.data![key]);
                });
            }

            // Send push notifications
            const response = await FCMService.sendToMultipleDevices(
                allTokens,
                {
                    title: payload.title,
                    body: payload.body
                },
                fcmData
            );

            console.log(`✅ Sent: ${response.successCount}/${allTokens.length} devices`);

            // Clean invalid tokens
            if (response.failureCount > 0) {
                await this.cleanupInvalidTokens(response, allTokens, recipients);
            }

            // Notify admins if needed
            if (payload.notifyAdmin) {
                await this.notifyAdmins(payload);
            }

            return {
                notification,
                sentCount: response.successCount,
                failedCount: response.failureCount
            };

        } catch (error) {
            console.error('❌ Notification error:', error);
            throw error;
        }
    }

    private static async cleanupInvalidTokens(response: any, tokens: string[], users: any[]) {
        const invalidTokens: string[] = [];

        response.responses.forEach((resp: any, idx: number) => {
            if (!resp.success && resp.error) {
                const code = resp.error.code;
                if (code === 'messaging/invalid-registration-token' ||
                    code === 'messaging/registration-token-not-registered') {
                    invalidTokens.push(tokens[idx]);
                }
            }
        });

        if (invalidTokens.length > 0) {
            console.log(`🧹 Cleaning ${invalidTokens.length} invalid tokens`);
            
            for (const user of users) {
                await Admin.updateOne(
                    { _id: user._id },
                    { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
                );
            }
        }
    }

    private static async notifyAdmins(payload: ISendNotificationPayload) {
        try {
            const admins = await Admin.find({
                role: 'Admin'
            }).select('fcmTokens');

            const adminTokens: string[] = [];
            admins.forEach(admin => {
                if (admin.fcmTokens && admin.fcmTokens.length > 0) {
                    admin.fcmTokens.forEach((tokenObj: any) => {
                        adminTokens.push(tokenObj.token);
                    });
                }
            });

            if (adminTokens.length > 0) {
                await FCMService.sendToMultipleDevices(
                    adminTokens,
                    {
                        title: `[Admin] ${payload.title}`,
                        body: payload.body
                    },
                    { ...payload.data as any, admin: 'true', type: payload.type }
                );

                console.log(`✅ Admin notified: ${adminTokens.length} devices`);
            }
        } catch (error) {
            console.error('❌ Admin notification error:', error);
        }
    }

    static async getUserNotifications(userId: Types.ObjectId, page: number = 1, limit: number = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ receiverId: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ receiverId: userId }),
            Notification.countDocuments({ receiverId: userId, isRead: false })
        ]);

        return {
            notifications,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            unreadCount
        };
    }

    static async markAsRead(notificationId: Types.ObjectId, userId: Types.ObjectId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, receiverId: userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
    }

    static async markAllAsRead(userId: Types.ObjectId) {
        return await Notification.updateMany(
            { receiverId: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }

    static async deleteNotification(notificationId: Types.ObjectId, userId: Types.ObjectId) {
        return await Notification.findOneAndDelete({
            _id: notificationId,
            receiverId: userId
        });
    }
}

export default NotificationService;