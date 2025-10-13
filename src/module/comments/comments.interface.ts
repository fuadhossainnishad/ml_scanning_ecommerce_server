import { Types } from "mongoose";

export interface IComments {
  postId: Types.ObjectId
  role: string,
  commentorId: Types.ObjectId
  comments: string
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}



export type TUpdateComments = Partial<IComments> & {
  postId: Types.ObjectId
}