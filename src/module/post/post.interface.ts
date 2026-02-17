import { Types } from "mongoose";

export interface IPost {
  uploaderId: Types.ObjectId
  uploaderType: string
  brandId: Types.ObjectId
  brandName: string
  attachment: string[]
  caption: string
  tags: string[]
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export type TUpdatePost = Partial<IPost> & {
  postId: Types.ObjectId
}