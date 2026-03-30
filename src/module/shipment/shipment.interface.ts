import { Types } from 'mongoose';

export enum ShipmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface IShipmentEvent {
  status: string;
  timestamp: Date;
  description?: string;
}

export interface IShipment {
  orderId: Types.ObjectId;
  brandId: Types.ObjectId;
  cartProductIds: Types.ObjectId[];

  senderAddressCode: number;
  receiverAddressCode: number;

  requestToken?: string;
  selectedCourierName?: string;
  selectedServiceCode?: string;
  selectedCourierId?: string;
  shippingCost: number;

  shipbubbleOrderId?: string;
  trackingCode?: string;
  trackingUrl?: string;
  waybillUrl?: string;

  status: ShipmentStatus;
  estimatedDeliveryDays?: number;
  events: IShipmentEvent[];

  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;

  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
