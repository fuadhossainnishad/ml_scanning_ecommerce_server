import { RequestHandler } from "express";
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import catchAsync from "../../utility/catchAsync";
import sendResponse from "../../utility/sendResponse";
import ProfileServices from "./profile.services";
import NotificationService from "../notification/notification.service";
import { NotificationType } from "../notification/notification.interface";

const getProfile: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
            ""
        );
    }

    const result = await ProfileServices.getProfileService(req)
    await NotificationService.sendNotification({
        ownerId: req.user._id,
        receiverId: [req.user._id],
        type: NotificationType.SYSTEM,
        title: '👋 Welcome Back!',
        body: `You fetch your profile successfully`,
        data: {
            userId: req.user._id.toString(),
            role: req.user.role,
            action: 'login',
            loginTime: new Date().toISOString()
        },
        notifyAdmin: false
    });
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "successfully retrieve profile data",
        data: result,
    });
}
)




const ProfileController = {
    getProfile
}

export default ProfileController;