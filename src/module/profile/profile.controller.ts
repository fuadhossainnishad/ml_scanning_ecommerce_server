import { RequestHandler } from "express";
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import catchAsync from "../../utility/catchAsync";
import sendResponse from "../../utility/sendResponse";
import ProfileServices from "./profile.services";

const getProfile: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
            ""
        );
    }

    const result = await ProfileServices.getProfileService(req)

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