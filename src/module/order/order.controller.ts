import { RequestHandler } from "express"
import catchAsync from "../../utility/catchAsync"
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import sendResponse from "../../utility/sendResponse";

const payment: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
        );
    }

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Successfully added to cart",
        data: result,
    });
})

const OrderController = {
    payment
}
export default OrderController