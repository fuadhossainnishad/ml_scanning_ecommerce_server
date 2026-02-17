// notification/notification.controller.ts
import httpStatus from "http-status";
import { RequestHandler } from "express";
import catchAsync from "../../utility/catchAsync";
import AppError from "../../app/error/AppError";
import GenericService from "../../utility/genericService.helpers";
import { INotification } from "./notification.interface";
import { idConverter } from "../../utility/idConverter";
import Notification from "./notification.model";
import sendResponse from "../../utility/sendResponse";
import NotificationService from "./notification.service";

// Get single notification by ID
const getNotification: RequestHandler = catchAsync(async (req, res) => {
    const { id } = req.query;
    
    if (!id || typeof id !== "string") {
        throw new AppError(httpStatus.BAD_REQUEST, "Notification ID is required");
    }

    const result = await GenericService.findResources<INotification>(
        Notification,
        await idConverter(id)
    );

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Successfully retrieved notification",
        data: result,
    });
});

// Get all notifications for authenticated user
const getAllNotification: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const { page = 1, limit = 20 } = req.query;

    // Get user's notifications with pagination
    const result = await NotificationService.getUserNotifications(
        req.user._id,
        Number(page),
        Number(limit)
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Successfully retrieved notifications",
        data: result,
    });
});

// Get all notifications (Admin only - for your existing getAllNotification)
const getAllNotificationsAdmin: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user || req.user.role !== 'Admin') {
        throw new AppError(httpStatus.FORBIDDEN, "Admin access required");
    }

    const result = await GenericService.findAllResources<INotification>(
        Notification,
        req.query,
        []
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Successfully retrieved all notifications",
        data: result,
    });
});

// Mark notification as read
const markAsRead: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const { notificationId } = req.params;

    if (!notificationId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Notification ID is required");
    }

    const result = await NotificationService.markAsRead(
        await idConverter(notificationId),
        req.user._id
    );

    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Notification marked as read",
        data: result,
    });
});

// Mark all notifications as read
const markAllAsRead: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    await NotificationService.markAllAsRead(req.user._id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "All notifications marked as read",
        data: null,
    });
});

// Delete notification
const deleteNotification: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const notificationId = req.body.data?.id || req.params.notificationId;

    if (!notificationId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Notification ID is required");
    }

    // Check if user is owner or admin
    const notification = await Notification.findById(await idConverter(notificationId));

    if (!notification) {
        throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
    }

    const isOwner = notification.ownerId.toString() === req.user._id.toString();
    const isReceiver = notification.receiverId.some(
        (id) => id.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isReceiver && !isAdmin) {
        throw new AppError(httpStatus.FORBIDDEN, "Not authorized to delete this notification");
    }

    await NotificationService.deleteNotification(
        await idConverter(notificationId),
        req.user._id
    );

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Successfully deleted notification",
        data: null,
    });
});

// Get unread count
const getUnreadCount: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const count = await Notification.countDocuments({
        receiverId: req.user._id,
        isRead: false,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Unread count retrieved",
        data: { unreadCount: count },
    });
});

// Register FCM Token
const registerFCMToken: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const { token, device } = req.body.data || req.body;

    if (!token) {
        throw new AppError(httpStatus.BAD_REQUEST, "FCM token is required");
    }

    const Admin = (await import("../admin/admin.model")).default;

    // Check if token already exists
    const user = await Admin.findById(req.user._id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const tokenExists = user.fcmTokens?.some((t: any) => t.token === token);

    if (!tokenExists) {
        await Admin.findByIdAndUpdate(req.user._id, {
            $push: {
                fcmTokens: {
                    token,
                    device: device || 'android',
                    addedAt: new Date(),
                },
            },
        });

        console.log(`✅ FCM token registered for ${req.user.role} ${req.user._id}`);
    } else {
        console.log(`ℹ️ FCM token already registered`);
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "FCM token registered successfully",
        data: null,
    });
});

// Remove FCM Token
const removeFCMToken: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const { token } = req.body.data || req.body;

    if (!token) {
        throw new AppError(httpStatus.BAD_REQUEST, "FCM token is required");
    }

    const Admin = (await import("../admin/admin.model")).default;

    await Admin.findByIdAndUpdate(req.user._id, {
        $pull: { fcmTokens: { token } },
    });

    console.log(`✅ FCM token removed for ${req.user.role} ${req.user._id}`);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "FCM token removed successfully",
        data: null,
    });
});

// Update Notification Settings
const updateNotificationSettings: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const settings = req.body.data || req.body;

    const Admin = (await import("../admin/admin.model")).default;

    await Admin.findByIdAndUpdate(req.user._id, {
        notificationSettings: settings,
    });

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Notification settings updated successfully",
        data: settings,
    });
});

// Get Notification Settings
const getNotificationSettings: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const Admin = (await import("../admin/admin.model")).default;

    const user = await Admin.findById(req.user._id).select('notificationSettings');

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Notification settings retrieved",
        data: user?.notificationSettings || {
            pushEnabled: true,
            emailEnabled: true,
            orderUpdates: true,
            promotions: false,
            rewards: true,
            withdrawals: true,
        },
    });
});

const NotificationController = {
    // Existing methods
    getNotification,
    getAllNotification,
    getAllNotificationsAdmin,
    deleteNotification,

    // New FCM methods
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    registerFCMToken,
    removeFCMToken,
    updateNotificationSettings,
    getNotificationSettings,
};

export default NotificationController;