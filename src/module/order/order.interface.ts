import { Types } from "mongoose";

export interface DeliveryAddress {
    name: string
    contact: string
    spotDetails: string
}

export enum PaymentStatus {
    PENDING = 'pending',
    CANCEL = 'cancel',
    PAID = 'paid'
}

export enum OrderStatus {
    PROCESSING = 'processing',
    CONFIRM = 'confirmed',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered'
}

export enum SellerStatus {
    MARK_READY = 'mark_ready',
    MARK_FOR_SHIPPING = 'mark_for_shipping',
    MARK_FOR_COMPLETE = 'mark_for_complete',
    DELIVERED = 'delivered'
}
export enum RemindeStatus {
    PROCESSING = 'processing',
    READY_TO_SHIP = 'ready_to_ship',
    READY_TO_DELIVERED = 'ready_to_delivered',
    DELIVERED = 'delivered'
}

export interface OrderItem {
    cartProductId: Types.ObjectId;
    sellerStatus: SellerStatus;
    remindStatus: RemindeStatus;
    deliveredAt?: Date;
    shippedAt?: Date;
    cancelledAt?: Date;
}
export interface IOrder {
    cartId: Types.ObjectId
    userId: Types.ObjectId
    userType: string
    address: DeliveryAddress,
    items: OrderItem[];
    orderStatus: OrderStatus
    paymentStatus: PaymentStatus
    isDeleted: boolean
    createdAt: Date;
    updatedAt: Date;
}