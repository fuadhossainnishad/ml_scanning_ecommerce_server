import { Types } from "mongoose";
import { IProducts } from "../cart/cart.interface";

export interface IOrder {
    paymentId: Types.ObjectId
    userId: Types.ObjectId
    userType: string
    products: IProducts[]
    subTotal: number
    shippingCharge: number
    totalAmount: number
    orderStatus: string
    paymentStatus: boolean
    paymentMethod: string
    isDeleted: boolean
    createdAt: Date;
    updatedAt: Date;
}