import { Document, Types } from "mongoose";

export interface IReview {
  userId: Types.ObjectId
  productId: Types.ObjectId
  ratings: number;
  attachment: string[];
  comments: string;
  isDeleted: boolean;
  createdAt: Date
  updatedAt: Date
}

export type TReviewUpdate = Partial<IReview> & {
  reviewId: string;
};

export interface IRecentActivity extends Document {
  title: string;
}

export interface IReport extends Document {
  title: string;
}


