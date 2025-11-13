import { Types } from "mongoose";
import { TSize } from "../product/product.interface";

export interface IProducts {
  _id?: Types.ObjectId;
  productId: Types.ObjectId
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

export interface IProductResponse extends IProducts {
  _id: Types.ObjectId;
}

export interface ICartResponse {
  _id: Types.ObjectId;
  userId: Types.ObjectId
  products: IProductResponse[]
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TCartUpdate = Partial<Omit<ICart, 'products'>> & {
  _id: string;
  products: TProductsUpdate[];
};