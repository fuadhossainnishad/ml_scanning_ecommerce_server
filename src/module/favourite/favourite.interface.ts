import { Types } from "mongoose";

export interface IFavourite {
  ownerId: Types.ObjectId
  ownerType: string
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}
export interface IFavouritePost extends IFavourite {
  postId: Types.ObjectId
}
export type TUpdateFavouritePost = Partial<IFavouritePost> & {
  _id: Types.ObjectId
}

export interface IFavouriteProduct extends IFavourite {
  productId: Types.ObjectId
}

export type TUpdateFavouriteProduct = Partial<IFavouriteProduct> & {
  _id: Types.ObjectId
}