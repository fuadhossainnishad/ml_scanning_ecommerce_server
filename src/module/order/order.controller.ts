import { NextFunction, RequestHandler } from "express"
import catchAsync from "../../utility/catchAsync"
import AppError from "../../app/error/AppError";
import httpStatus from 'http-status';
import GenericService from '../../utility/genericService.helpers';
import sendResponse from '../../utility/sendResponse';
import Order from './order.model';
import { IOrder, RemindeStatus, SellerStatus } from "./order.interface";
import { idConverter } from "../../utility/idConverter";
import OrderServices from "./order.services";

const getOrders: RequestHandler = catchAsync(async (req, res) => {
    if (!req.user) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated user is required",
        );
    }

    // const query = {
    //     ...req.query,
    //     paymentStatus: PaymentStatus.PAID
    // }

    // const result = await GenericService.findAllResources<IOrder>(Order, query, [])

    const result = await OrderServices.getOrderService(req)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Successfully retirieve order data",
        data: result,
    });
})

const updateStatus: RequestHandler = catchAsync(async (req, res, next: NextFunction) => {
    if (req.user.role !== 'Brand') {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated brand is required",
        );
    }

    const { cartProductId, sellerStatus } = req.body.data

    if (!cartProductId || !sellerStatus) {
        throw new AppError(httpStatus.BAD_REQUEST, 'cartProductId and sellerStatus are required');
    }
    const query = {
        items: {
            $elemMatch: {
                cartProductId: await idConverter(cartProductId),
                sellerStatus: sellerStatus,
            },
        },
    };

    const nextSellerStatusMap: Record<SellerStatus, SellerStatus | null> = {
        [SellerStatus.MARK_READY]: SellerStatus.MARK_FOR_SHIPPING,
        [SellerStatus.MARK_FOR_SHIPPING]: SellerStatus.MARK_FOR_COMPLETE,
        [SellerStatus.MARK_FOR_COMPLETE]: SellerStatus.DELIVERED,
        [SellerStatus.DELIVERED]: null,

    };

    const nextSellerStatus = nextSellerStatusMap[sellerStatus as SellerStatus];
    if (!nextSellerStatus) {
        throw new AppError(httpStatus.BAD_REQUEST, `No valid transition from sellerStatus: ${sellerStatus}`);
    }

    // Define corresponding remindStatus for the next sellerStatus
    const remindStatusMap: Record<SellerStatus, RemindeStatus> = {
        [SellerStatus.MARK_READY]: RemindeStatus.PROCESSING,
        [SellerStatus.MARK_FOR_SHIPPING]: RemindeStatus.READY_TO_SHIP,
        [SellerStatus.MARK_FOR_COMPLETE]: RemindeStatus.READY_TO_DELIVERED,
        [SellerStatus.DELIVERED]: RemindeStatus.DELIVERED,
    };

    const newRemindStatus = remindStatusMap[nextSellerStatus];


    const findOrders = await GenericService.findAllResources<IOrder>(Order, query, ['items.cartProductId', 'items.sellerStatus'])

    console.log(findOrders);

    if (!findOrders || !findOrders.order || findOrders.meta.total === 0) {
        throw new AppError(httpStatus.NOT_FOUND, 'Order item not found or status not matchng');
    }

    const updateResult = await Order.updateMany(
        query,
        {
            $set: {
                'items.$[elem].sellerStatus': nextSellerStatus,
                'items.$[elem].remindStatus': newRemindStatus,
                updatedAt: new Date(),
            },
        },
        {
            arrayFilters: [
                {
                    'elem.cartProductId': await idConverter(cartProductId),
                    'elem.sellerStatus': sellerStatus,
                },
            ],
        }
    );
    if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
        throw new AppError(httpStatus.NOT_FOUND, `Failed to update item in order: ${findOrders.order}`);
    }

    const result = await OrderServices.getOrderService(req)




    if (nextSellerStatus === SellerStatus.DELIVERED) {
        req.body.data.orderUpdateData = {
            updatedOrders: result,
            cartProductId: await idConverter(cartProductId),
            userId: req.user._id!,
        };
        next()
    }
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Successfully update the order status",
        data: result,
    });
})

const getTransaction: RequestHandler = catchAsync(async (req, res) => {
    if (req.user.role !== 'Brand') {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Authenticated brand is required",
        );
    }

    const result = await OrderServices.getTransactionService(req)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Successfully earning status",
        data: result,
    });
})

const OrderController = {
    getOrders,
    updateStatus,
    getTransaction
}
export default OrderController