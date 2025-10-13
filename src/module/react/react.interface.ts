import { Types } from "mongoose";

export interface IReact {
  postId: Types.ObjectId
  reactorId: Types.ObjectId[]
  reactorType: string
  totalReact: number
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export type TUpdateComments = Partial<IReact> & {
  _id: Types.ObjectId
}
