import { Types } from "mongoose";
import { TSize } from "../product/product.interface";

export interface IProducts {
  productId: Types.ObjectId[]
  color: string
  size: TSize
  quantity: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TProductsUpdate = Partial<IProducts> & {
  _id: string;
};

export interface ICart {
  userId: Types.ObjectId
  products: IProducts[]
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TCartUpdate = Partial<ICart> & {
  _id: string;
};