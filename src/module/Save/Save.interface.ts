import { Types } from "mongoose";

export interface ISavePost {
  saverId: Types.ObjectId
  saverType: string
  postId: Types.ObjectId
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export type TUpdateSavePost = Partial<ISavePost> & {
  _id: Types.ObjectId
}