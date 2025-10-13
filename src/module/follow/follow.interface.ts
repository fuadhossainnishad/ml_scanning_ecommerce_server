import { Types } from "mongoose";

export interface IFollow {
  authorId: Types.ObjectId
  authorType: string
  followerId: Types.ObjectId[]
  followerType: string
  totalFollower: number
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}



export type TUpdateComments = Partial<IFollow> & {
  _id: Types.ObjectId
}