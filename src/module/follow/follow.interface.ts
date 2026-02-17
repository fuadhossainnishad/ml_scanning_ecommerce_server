import { Types } from "mongoose";

export interface IFollowBase {
  id: Types.ObjectId
  type: string
}

export interface IFollow {
  authorId: Types.ObjectId
  authorType: string
  following: IFollowBase[]
  totalFollowing?: number
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}



export type TUpdateComments = Partial<IFollow> & {
  _id: Types.ObjectId
}