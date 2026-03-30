import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utility/catchAsync';
import sendResponse from '../../utility/sendResponse';
import AppError from '../../app/error/AppError';
import ShipbubbleService from '../shipbubble/shipbubble.service';
import ShippingService from './shipping.service';
import Brand from '../brand/brand.model';
import Cart from '../cart/cart.model';

/**
 * Validate an address via Shipbubble
 * Used by both customers (checkout) and brands (settings)
 */
const validateAddress: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const { name, email, phone, address } = req.body.data;
  if (!name || !email || !phone || !address) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Name, email, phone, and address are required');
  }

  const result = await ShipbubbleService.validateAddress({ name, email, phone, address });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Address validated successfully',
    data: result,
  });
});

/**
 * Update brand's pickup address (validate + save)
 */
const updatePickupAddress: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user || req.user.role !== 'Brand') {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Only brands can set a pickup address');
  }

  const { name, email, phone, address } = req.body.data;
  if (!name || !email || !phone || !address) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Name, email, phone, and address are required');
  }

  const validated = await ShipbubbleService.validateAddress({ name, email, phone, address });

  await Brand.findByIdAndUpdate(req.user._id, {
    pickupAddress: { name, email, phone, address },
    pickupAddressCode: validated.address_code,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Pickup address validated and saved',
    data: {
      pickupAddress: { name, email, phone, address },
      pickupAddressCode: validated.address_code,
      formattedAddress: validated.formatted_address,
    },
  });
});

/**
 * Get shipping rates for checkout
 * Groups cart by brand, fetches rates per brand
 */
const getCheckoutRates: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const { address } = req.body.data;
  if (!address?.name || !address?.phone || !address?.street) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Address details are required');
  }

  // Find user's active cart
  const cart = await Cart.findOne({ userId: req.user._id, isDeleted: false });
  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, 'No active cart found');
  }

  const result = await ShippingService.getCheckoutRates(address, cart._id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Shipping rates fetched',
    data: result,
  });
});

/**
 * Book a shipment (called when brand marks order as ready)
 */
const bookShipment: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user || req.user.role !== 'Brand') {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Only brands can book shipments');
  }

  const { orderId } = req.body.data;
  if (!orderId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order ID is required');
  }

  const shipment = await ShippingService.bookShipment(orderId, req.user._id.toString());

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Shipment booked successfully',
    data: {
      shipmentId: shipment._id,
      shipbubbleOrderId: shipment.shipbubbleOrderId,
      trackingCode: shipment.trackingCode,
      trackingUrl: shipment.trackingUrl,
      waybillUrl: shipment.waybillUrl,
      courierName: shipment.selectedCourierName,
      status: shipment.status,
    },
  });
});

/**
 * Get tracking info for all shipments in an order
 */
const getTracking: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const { orderId } = req.params;
  if (!orderId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order ID is required');
  }

  const tracking = await ShippingService.getOrderTracking(orderId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tracking info retrieved',
    data: tracking,
  });
});

/**
 * Get Shipbubble wallet balance (admin only)
 */
const getWalletBalance: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user || req.user.role !== 'Admin') {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Only admins can check wallet balance');
  }

  const balance = await ShipbubbleService.getWalletBalance();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Wallet balance retrieved',
    data: balance,
  });
});

/**
 * Shipbubble webhook handler
 */
const webhookHandler: RequestHandler = catchAsync(async (req, res) => {
  console.log('[Shipbubble Webhook] Received:', JSON.stringify(req.body));

  await ShippingService.handleWebhook(req.body);

  res.status(200).json({ received: true });
});

const ShippingController = {
  validateAddress,
  updatePickupAddress,
  getCheckoutRates,
  bookShipment,
  getTracking,
  getWalletBalance,
  webhookHandler,
};

export default ShippingController;
