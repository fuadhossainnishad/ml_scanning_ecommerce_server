import { Document, Types } from "mongoose";

export interface ICart {
  userId: Types.ObjectId
  productId: Types.ObjectId[]
  ratings: number;
  attachment: string;
  comments: string;
  isDeleted: boolean;
}

export type TCartUpdate = Partial<ICart> & {
  reviewId: string;
};

export interface IRecentActivity extends Document {
  title: string;
}

export interface IReport extends Document {
  title: string;
}


