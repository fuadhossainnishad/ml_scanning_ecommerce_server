import { Types } from "mongoose";

export interface IFavouritePost {
  ownerId: Types.ObjectId
  ownerType: string
  postId: Types.ObjectId[]
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export type TUpdateFavouritePost = Partial<IFavouritePost> & {
  _id: Types.ObjectId
}

export interface IFavouriteProduct {
  ownerId: Types.ObjectId
  ownerType: string
  productId: Types.ObjectId[]
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export type TUpdateFavouriteProduct = Partial<IFavouriteProduct> & {
  _id: Types.ObjectId
}