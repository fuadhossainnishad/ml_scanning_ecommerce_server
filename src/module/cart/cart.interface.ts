import { Types } from "mongoose";
import { TSize } from "../product/product.interface";

export interface ISelect {
  userId: Types.ObjectId
  productId: Types.ObjectId[]
  color: string
  size: TSize
  quantity: number;
  isDeleted: boolean;
}

export type TSelectUpdate = Partial<ISelect> & {
  _id: string;
};

export interface ICart {
  select: ISelect[]
}

export type TCartUpdate = Partial<ICart> & {
  _id: string;
};