import express from "express";
import NotificationController from "./notification.controller";
import auth from "../../middleware/auth";

const router = express.Router();

// ============ FCM Token Management ============
router.post(
  "/fcm/register",
  auth('User', 'Brand'),
  NotificationController.registerFCMToken
);

router.post(
  "/fcm/remove",
  auth('User', 'Brand'),
  NotificationController.removeFCMToken
);

// ============ Notification Settings ============
router.get(
  "/settings",
  auth('User', 'Brand'),
  NotificationController.getNotificationSettings
);

router.patch(
  "/settings",
  auth('User', 'Brand'),
  NotificationController.updateNotificationSettings
);

// ============ Notification Read Status ============
router.get(
  "/unread-count",
  auth('User', 'Brand'),
  NotificationController.getUnreadCount
);

router.patch(
  "/read-all",
  auth('User', 'Brand'),
  NotificationController.markAllAsRead
);

router.patch(
  "/:notificationId/read",
  auth('User', 'Brand'),
  NotificationController.markAsRead
);

// ============ Notification CRUD ============
// Get single notification by query param
router.get(
  "/single",
  auth('User', 'Brand', 'Admin'),
  NotificationController.getNotification
);

// Get all notifications (Admin only - for your existing method)
router.get(
  "/admin/all",
  auth('Admin'),
  NotificationController.getAllNotificationsAdmin
);

// Get user's notifications (paginated) - Your existing route
router.get(
  "/",
  auth('User', 'Brand'),
  NotificationController.getAllNotification
);

// Delete notification by ID in params
router.delete(
  "/:notificationId",
  auth('User', 'Brand', 'Admin'),
  NotificationController.deleteNotification
);

// Delete notification by ID in body - Your existing route
router.delete(
  "/",
  auth('User', 'Brand', 'Admin'),
  NotificationController.deleteNotification
);

const NotificationRouter = router;
export default NotificationRouter;