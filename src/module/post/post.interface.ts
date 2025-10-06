import { Types } from "mongoose";

export interface IComments {
  userId: Types.ObjectId
  comment: string
  createdAt: Date
  updatedAt: Date
}

export interface IPost {
  brandId: Types.ObjectId
  brandName: string
  brandLogo: string
  attachment: string
  caption: string
  tags: string[]
  likes: Types.ObjectId[]
  totalLikes: number
  comments: IComments[]
  totalComments: number
  createdAt: Date
  updatedAt: Date
}

export type TUpdatePost = Partial<IPost> & {
  postId: Types.ObjectId
}