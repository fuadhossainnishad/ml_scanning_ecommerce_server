import { Types } from "mongoose";

export interface IComments {
  userId: Types.ObjectId
  comment: string
}

export interface IPost {
  userId: Types.ObjectId
  brandId: Types.ObjectId
  brandName: string
  attachment: string
  caption: string
  tags: string[]
  likes: Types.ObjectId[]
  totalLikes: number
  comments: IComments[]
  totalComments: number
}

export type TUpdatePost = Partial<IPost> & {
  postId: Types.ObjectId
}