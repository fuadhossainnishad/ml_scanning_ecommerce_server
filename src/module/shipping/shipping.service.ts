import { Types } from 'mongoose';
import Cart from '../cart/cart.model';
import Product from '../product/product.model';
import Brand from '../brand/brand.model';
import Order from '../order/order.model';
import Shipment from '../shipment/shipment.model';
import { ShipmentStatus } from '../shipment/shipment.interface';
import { SellerStatus, RemindeStatus } from '../order/order.interface';
import ShipbubbleService from '../shipbubble/shipbubble.service';
import config from '../../app/config';
import AppError from '../../app/error/AppError';
import httpStatus from 'http-status';
import NotificationService from '../notification/notification.service';
import { NotificationType } from '../notification/notification.interface';

interface BrandGroup {
  brandId: string;
  brandName: string;
  pickupAddressCode: number;
  items: {
    cartProductId: string;
    productName: string;
    weight: number;
    price: number;
    quantity: number;
  }[];
  totalWeight: number;
}

/**
 * Group cart products by brand, looking up product details
 */
const groupCartByBrand = async (cartId: string | Types.ObjectId): Promise<BrandGroup[]> => {
  const cart = await Cart.findById(cartId);
  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  const cartProducts = (cart.products || []).filter((p: any) => !p.isDeleted);
  if (!cartProducts.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Cart is empty');
  }

  const productIds = cartProducts.map((p: any) => p.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();

  const brandIds = [...new Set(products.map(p => p.brandId.toString()))];
  const brands = await Brand.find({ _id: { $in: brandIds } }).lean();
  const brandMap = new Map(brands.map(b => [b._id.toString(), b]));

  const groups = new Map<string, BrandGroup>();

  for (const cartProduct of cartProducts) {

    const product = products.find(p => (p as any)._id.toString() === cartProduct.productId.toString());
    if (!product) continue;

    const brandIdStr = product.brandId.toString();
    const brand = brandMap.get(brandIdStr) as any;

    if (!groups.has(brandIdStr)) {
      if (!brand?.pickupAddressCode) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `${brand?.brandName || 'A brand'} has not set up shipping yet. Please remove their items or try again later.`
        );
      }

      groups.set(brandIdStr, {
        brandId: brandIdStr,
        brandName: brand?.brandName || '',
        pickupAddressCode: brand.pickupAddressCode,
        items: [],
        totalWeight: 0,
      });
    }

    const group = groups.get(brandIdStr)!;
    const weight = product.weight || 0.5;
    group.items.push({
      cartProductId: (cartProduct as any)._id.toString(),
      productName: product.productName,
      weight,
      price: product.price,
      quantity: cartProduct.quantity,
    });
    group.totalWeight += weight * cartProduct.quantity;
  }

  return Array.from(groups.values());
};

/**
 * Get tomorrow's date formatted as yyyy-mm-dd
 */
const getPickupDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Fetch shipping rates for checkout — validates address, groups by brand, gets rates
 */
const getCheckoutRates = async (
  address: { name: string; email: string; phone: string; street: string; city: string; state: string; country: string; postalCode: string },
  cartId: string | Types.ObjectId
) => {
  // Validate customer address
  const fullAddress = [address.street, address.city, address.state, address.country, address.postalCode].filter(Boolean).join(', ');
  const validated = await ShipbubbleService.validateAddress({
    name: address.name,
    email: address.email,
    phone: address.phone,
    address: fullAddress,
  });

  const receiverAddressCode = validated.address_code;
  const brandGroups = await groupCartByBrand(cartId);

  const rates = [];
  let shippingTotal = 0;

  for (const group of brandGroups) {
    const rateResult = await ShipbubbleService.fetchRates({
      sender_address_code: group.pickupAddressCode,
      receiver_address_code: receiverAddressCode,
      pickup_date: getPickupDate(),
      category_id: config.shipbubble.defaultCategoryId,
      package_items: group.items.map(item => ({
        name: item.productName,
        description: item.productName,
        unit_weight: item.weight,
        unit_amount: item.price,
        quantity: item.quantity,
      })),
      package_dimension: { length: 30, width: 30, height: 15 },
    });

    const cheapestRate = rateResult.cheapest_courier?.total || 0;
    shippingTotal += cheapestRate;

    rates.push({
      brandId: group.brandId,
      brandName: group.brandName,
      requestToken: rateResult.request_token,
      couriers: rateResult.couriers.map(c => ({
        courierId: c.courier_id,
        courierName: c.courier_name,
        serviceCode: c.service_code,
        rate: c.total,
        currency: c.currency,
        estimatedDays: c.delivery_eta_time,
      })),
      cheapest: rateResult.cheapest_courier ? {
        courierId: rateResult.cheapest_courier.courier_id,
        courierName: rateResult.cheapest_courier.courier_name,
        serviceCode: rateResult.cheapest_courier.service_code,
        rate: rateResult.cheapest_courier.total,
      } : null,
      fastest: rateResult.fastest_courier ? {
        courierId: rateResult.fastest_courier.courier_id,
        courierName: rateResult.fastest_courier.courier_name,
        serviceCode: rateResult.fastest_courier.service_code,
        rate: rateResult.fastest_courier.total,
      } : null,
    });
  }

  return {
    receiverAddressCode,
    validatedAddress: validated,
    rates,
    shippingTotal,
  };
};

/**
 * Book a shipment when brand marks items as ready
 */
const bookShipment = async (orderId: string, brandId: string) => {
  const order = await Order.findById(orderId).populate('cartId');
  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  const brand = await Brand.findById(brandId).lean() as any;
  if (!brand?.pickupAddressCode) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Brand has not set up a pickup address');
  }

  if (!order.address.addressCode) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Order has no validated delivery address');
  }

  // Get cart products for this brand
  const cart = await Cart.findById(order.cartId).lean();
  if (!cart) {
    throw new AppError(httpStatus.NOT_FOUND, 'Cart not found');
  }

  const cartProducts = (cart.products || []) as any[];
  const productIds = cartProducts.map((p: any) => p.productId);
  const products = await Product.find({ _id: { $in: productIds }, brandId }).lean();
  const brandProductIds = new Set(products.map(p => (p as any)._id.toString()));

  const brandCartProducts = cartProducts.filter((cp: any) =>
    brandProductIds.has(cp.productId.toString()) && !cp.isDeleted
  );

  if (!brandCartProducts.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No products found for this brand in the order');
  }

  // Build package items
  const packageItems = brandCartProducts.map((cp: any) => {
    const product = products.find(p => (p as any)._id.toString() === cp.productId.toString());
    return {
      name: product?.productName || 'Product',
      description: product?.productName || 'Product',
      unit_weight: product?.weight || 0.5,
      unit_amount: product?.price || 0,
      quantity: cp.quantity,
    };
  });

  // Fetch fresh rates
  const rateResult = await ShipbubbleService.fetchRates({
    sender_address_code: brand.pickupAddressCode,
    receiver_address_code: order.address.addressCode,
    pickup_date: getPickupDate(),
    category_id: config.shipbubble.defaultCategoryId,
    package_items: packageItems,
    package_dimension: { length: 30, width: 30, height: 15 },
  });

  if (!rateResult.cheapest_courier) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No couriers available for this shipment');
  }

  const courier = rateResult.cheapest_courier;

  // Create Shipbubble label
  const label = await ShipbubbleService.createLabel({
    request_token: rateResult.request_token,
    service_code: courier.service_code,
    courier_id: courier.courier_id,
  });

  // Create shipment record
  const shipment = await Shipment.create({
    orderId: order._id,
    brandId,
    cartProductIds: brandCartProducts.map((cp: any) => cp._id),
    senderAddressCode: brand.pickupAddressCode,
    receiverAddressCode: order.address.addressCode,
    requestToken: rateResult.request_token,
    selectedCourierName: courier.courier_name,
    selectedServiceCode: courier.service_code,
    selectedCourierId: courier.courier_id,
    shippingCost: label.fee_amount || courier.total,
    shipbubbleOrderId: label.order_id,
    trackingCode: label.tracking_code,
    trackingUrl: label.tracking_url,
    waybillUrl: label.waybill_document,
    status: ShipmentStatus.CONFIRMED,
    events: [{ status: 'confirmed', timestamp: new Date(), description: 'Shipment booked' }],
  });

  // Update order items for this brand
  const cartProductIdSet = new Set(brandCartProducts.map((cp: any) => cp._id.toString()));
  for (const item of order.items) {
    if (cartProductIdSet.has(item.cartProductId.toString())) {
      item.sellerStatus = SellerStatus.MARK_FOR_SHIPPING;
      item.remindStatus = RemindeStatus.READY_TO_SHIP;
      item.shippedAt = new Date();
    }
  }
  await order.save();

  return shipment;
};

/**
 * Get tracking info for all shipments in an order
 */
const getOrderTracking = async (orderId: string) => {
  const shipments = await Shipment.find({ orderId, isDeleted: false }).lean();
  return shipments.map(s => ({
    id: (s as any)._id,
    brandId: s.brandId,
    courierName: s.selectedCourierName,
    status: s.status,
    trackingCode: s.trackingCode,
    trackingUrl: s.trackingUrl,
    waybillUrl: s.waybillUrl,
    shippingCost: s.shippingCost,
    estimatedDeliveryDays: s.estimatedDeliveryDays,
    events: s.events,
    pickedUpAt: s.pickedUpAt,
    deliveredAt: s.deliveredAt,
  }));
};

/**
 * Handle Shipbubble webhook status update
 */
const handleWebhook = async (payload: any) => {
  if (!payload || typeof payload !== 'object') {
    console.log('[Shipbubble Webhook] Invalid payload, ignoring');
    return;
  }

  const shipbubbleOrderId = payload.order_id;
  if (!shipbubbleOrderId) {
    console.log('[Shipbubble Webhook] No order_id in payload, ignoring');
    return;
  }

  const shipment = await Shipment.findOne({ shipbubbleOrderId });
  if (!shipment) {
    console.log(`[Shipbubble Webhook] No shipment found for order_id: ${shipbubbleOrderId}`);
    return;
  }

  const status = payload.status?.toLowerCase();
  const statusMap: Record<string, ShipmentStatus> = {
    pending: ShipmentStatus.PENDING,
    confirmed: ShipmentStatus.CONFIRMED,
    picked_up: ShipmentStatus.PICKED_UP,
    in_transit: ShipmentStatus.IN_TRANSIT,
    completed: ShipmentStatus.COMPLETED,
    cancelled: ShipmentStatus.CANCELLED,
  };

  const newStatus = statusMap[status];
  if (!newStatus || shipment.status === newStatus) {
    console.log(`[Shipbubble Webhook] Status unchanged or unknown: ${status}`);
    return;
  }

  // Update shipment
  shipment.status = newStatus;
  shipment.events.push({
    status,
    timestamp: new Date(),
    description: `Status updated to ${status}`,
  });

  if (newStatus === ShipmentStatus.PICKED_UP) {
    shipment.pickedUpAt = new Date();
  } else if (newStatus === ShipmentStatus.COMPLETED) {
    shipment.deliveredAt = new Date();
  } else if (newStatus === ShipmentStatus.CANCELLED) {
    shipment.cancelledAt = new Date();
  }

  await shipment.save();

  // Update order items based on shipment status
  const order = await Order.findById(shipment.orderId);
  if (!order) return;

  const cartProductIdSet = new Set(shipment.cartProductIds.map(id => id.toString()));
  let statusChanged = false;

  for (const item of order.items) {
    if (!cartProductIdSet.has(item.cartProductId.toString())) continue;

    if (newStatus === ShipmentStatus.PICKED_UP && item.sellerStatus !== SellerStatus.MARK_FOR_SHIPPING) {
      item.sellerStatus = SellerStatus.MARK_FOR_SHIPPING;
      item.remindStatus = RemindeStatus.READY_TO_SHIP;
      item.shippedAt = new Date();
      statusChanged = true;
    } else if (newStatus === ShipmentStatus.IN_TRANSIT && item.sellerStatus !== SellerStatus.MARK_FOR_COMPLETE) {
      item.sellerStatus = SellerStatus.MARK_FOR_COMPLETE;
      item.remindStatus = RemindeStatus.READY_TO_DELIVERED;
      statusChanged = true;
    } else if (newStatus === ShipmentStatus.COMPLETED && item.sellerStatus !== SellerStatus.DELIVERED) {
      item.sellerStatus = SellerStatus.DELIVERED;
      item.remindStatus = RemindeStatus.DELIVERED;
      item.deliveredAt = new Date();
      statusChanged = true;
    }
  }

  if (statusChanged) {
    await order.save();

    // Send notifications (non-blocking)
    try {
      if (newStatus === ShipmentStatus.PICKED_UP) {
        await NotificationService.sendNotification({
          ownerId: order.userId,
          receiverId: [order.userId],
          type: NotificationType.SYSTEM,
          title: 'Order picked up',
          body: 'Your order has been picked up by the courier and is on its way!',
          data: { orderId: order._id.toString(), status: 'picked_up', time: new Date().toISOString() },
          notifyAdmin: false,
        });
      } else if (newStatus === ShipmentStatus.COMPLETED) {
        await NotificationService.sendNotification({
          ownerId: order.userId,
          receiverId: [order.userId],
          type: NotificationType.SYSTEM,
          title: 'Order delivered',
          body: 'Your order has been delivered!',
          data: { orderId: order._id.toString(), status: 'delivered', time: new Date().toISOString() },
          notifyAdmin: false,
        });
      }
    } catch (notifErr: any) {
      console.error('[Shipbubble Webhook] Notification failed:', notifErr.message);
    }
  }
};

const ShippingService = {
  groupCartByBrand,
  getCheckoutRates,
  bookShipment,
  getOrderTracking,
  handleWebhook,
};

export default ShippingService;
